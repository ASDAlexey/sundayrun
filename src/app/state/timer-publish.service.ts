import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { PublishEventInput } from '../core/github/publish-event.interface';
import { eventDatesFromHistory } from '../core/history/event-dates';
import { setPublishStatus } from '../core/timer/session-actions';
import { sessionToParticipants } from '../core/timer/session-to-participants';
import { TimerPublishState, TimerPublishStateType } from '../core/timer/timer-session.enum';
import { TimerSession } from '../core/timer/timer-session.interface';
import { CdnRefService } from '../github/cdn-ref.service';
import { DbFreshness } from '../github/db-freshness.enum';
import { DbFreshnessService } from '../github/db-freshness.service';
import { PublishState } from '../github/github-storage.enum';
import { GithubStorageService } from '../github/github-storage.service';
import { HistoryService } from '../github/history.service';
import { PendingArchiveService } from '../github/pending-archive.service';
import { PublishDurationService } from '../github/publish-duration.service';
import { ProtocolStateService } from './protocol-state.service';
import {
  TIMER_PUBLISH_ARCHIVE_ERROR,
  TIMER_PUBLISH_AUTH_ERROR,
  TIMER_PUBLISH_COMMIT_ERROR,
  TIMER_PUBLISH_EMPTY_ERROR,
  TIMER_PUBLISH_STATE_BY_STEP,
} from './timer-publish.constant';
import { TimerPublishStep, TimerPublishStepType } from './timer-publish.enum';
import { TimerSessionService } from './timer-session.service';

/**
 * Sends a measurement down the ordinary upload pipeline, so «Сохранить» on `/timer` costs the
 * organiser exactly one press (docs/TIMER.md §8). Nothing new is invented here: the session becomes
 * `Participant[]`, the draft lands in `ProtocolStateService`, the archive history fills the race
 * number and the requisites in and computes the auto notes, and `GithubStorageService` commits the
 * whole thing atomically — the very sequence `/result` performs by hand. The deploy wait afterwards
 * mirrors `/result` as well, because the click is only «done» once the site actually serves the race.
 *
 * The promise never rejects: a failure becomes a `failed` status with a sentence the card can show,
 * the measurement stays untouched in localStorage, and pressing «Повторить» replays the same flow.
 */
@Injectable({ providedIn: 'root' })
export class TimerPublishService {
  readonly #sessions = inject(TimerSessionService);
  readonly #store = inject(ProtocolStateService);
  readonly #history = inject(HistoryService);
  readonly #github = inject(GithubStorageService);
  readonly #pendingArchive = inject(PendingArchiveService);
  readonly #dbFreshness = inject(DbFreshnessService);
  readonly #cdnRef = inject(CdnRefService);
  readonly #publishDuration = inject(PublishDurationService);
  readonly #step = signal<TimerPublishStepType>(TimerPublishStep.idle);
  readonly #error = signal<string | null>(null);
  readonly #publishedSlug = signal<string | null>(null);

  readonly step = this.#step.asReadonly();
  readonly error = this.#error.asReadonly();

  /** The archive slug of the published race — the «Открыть протокол» link; null until it lands. */
  readonly publishedSlug = this.#publishedSlug.asReadonly();

  /** The coarse status of the flow, the same vocabulary the session stores. */
  readonly state = computed<TimerPublishStateType>(() => TIMER_PUBLISH_STATE_BY_STEP[this.#step()]);

  /** When the «Сохранить» press happened; meaningful only while the deploy is being waited out. */
  #startedAtMs = 0;

  /** Set when the banner admitted the deploy; a heal back to Fresh after that means the poll gave up. */
  #deploySeen = false;

  constructor() {
    // Ends the click-to-live wait exactly as /result does: Updating marks the deploy as watched,
    // Updated completes it with a measured duration, a heal back to Fresh after Updating means the
    // poll gave up — the race is committed either way, so the card still reports success.
    effect(() => {
      const state = this.#dbFreshness.state();

      if (this.#step() !== TimerPublishStep.deploying) {
        return;
      }

      if (state === DbFreshness.Updating) {
        this.#deploySeen = true;
      } else if (state === DbFreshness.Updated || (state === DbFreshness.Fresh && this.#deploySeen)) {
        this.#finishDeployWait(state === DbFreshness.Updated);
      }
    });
  }

  /** Publishes one measurement; never rejects, and refuses a second press while one is in flight. */
  async publish(session: TimerSession): Promise<void> {
    if (this.state() === TimerPublishState.pending) {
      return;
    }

    this.#error.set(null);
    this.#publishedSlug.set(null);
    this.#step.set(TimerPublishStep.notes);
    this.#mark(session.id, TimerPublishState.pending, null, null);

    const inputs = await this.#buildInputs(session);

    if (inputs !== null) {
      await this.#commit(session, inputs);
    }
  }

  /** Back to the untouched card: the next «Сохранить» starts from a clean slate. */
  reset(): void {
    this.#step.set(TimerPublishStep.idle);
    this.#error.set(null);
    this.#publishedSlug.set(null);
    this.#deploySeen = false;
    this.#github.reset();
  }

  /**
   * The draft plus its auto notes. The race number, the city, the park and the chairman are filled
   * in by the store's own auto-fill the moment the published dates are known — nothing about the
   * requisites is decided here.
   */
  async #buildInputs(session: TimerSession): Promise<PublishEventInput[] | null> {
    this.#store.importSession(sessionToParticipants(session), session.dateIso);

    try {
      const history = await this.#history.loadHistory();

      this.#store.setPublishedEventDates(eventDatesFromHistory(history));
      this.#store.applyAutoNotes(history);
    } catch {
      this.#fail(session.id, TIMER_PUBLISH_ARCHIVE_ERROR);

      return null;
    }

    const inputs = this.#store.buildPublishInputs();

    if (inputs.length === 0) {
      this.#fail(session.id, TIMER_PUBLISH_EMPTY_ERROR);

      return null;
    }

    return inputs;
  }

  /** One atomic commit, then the same optimistic bookkeeping /admin relies on, then the deploy wait. */
  async #commit(session: TimerSession, inputs: PublishEventInput[]): Promise<void> {
    this.#step.set(TimerPublishStep.committing);
    this.#github.reset();

    const startedAtMs = Date.now();

    await this.#github.publish(inputs);

    const publishState = this.#github.state();

    if (publishState !== PublishState.success) {
      this.#fail(session.id, publishState === PublishState.authError ? TIMER_PUBLISH_AUTH_ERROR : TIMER_PUBLISH_COMMIT_ERROR);

      return;
    }

    const ref = await this.#cdnRef.resolve();

    this.#recordUploads(inputs);
    this.#publishedSlug.set(inputs[0].event.dateIso);
    this.#mark(session.id, TimerPublishState.published, null, ref);
    this.#startedAtMs = startedAtMs;
    this.#deploySeen = false;
    this.#step.set(TimerPublishStep.deploying);

    // The probe is memoized from the publish flow's own check, so this costs no extra request — it
    // only catches the rare deploy that landed before the wait could start watching for it.
    if (await this.#dbFreshness.pinnedDbAvailable(ref)) {
      this.#finishDeployWait(true);
    }
  }

  /** The archive db lags the commit, so /admin shows the race as «публикуется…» meanwhile. */
  #recordUploads(inputs: PublishEventInput[]): void {
    const atIso = new Date().toISOString();

    for (const input of inputs) {
      this.#pendingArchive.addUpload({
        slug: input.event.dateIso,
        number: input.event.number,
        dateIso: input.event.dateIso,
        participantCount: input.rows.length,
        atIso,
      });
    }
  }

  #finishDeployWait(measured: boolean): void {
    this.#step.set(TimerPublishStep.done);

    if (measured) {
      this.#publishDuration.record(Date.now() - this.#startedAtMs);
    }
  }

  #fail(sessionId: string, message: string): void {
    this.#error.set(message);
    this.#step.set(TimerPublishStep.failed);
    this.#mark(sessionId, TimerPublishState.failed, message, null);
  }

  #mark(sessionId: string, state: TimerPublishStateType, error: string | null, sha: string | null): void {
    this.#sessions.update(sessionId, (session) => setPublishStatus(session, { state, error, sha }));
  }
}

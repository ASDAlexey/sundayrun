import { Component, DOCUMENT, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { removeSplit } from '../../../core/timer/session-actions';
import { runnersWithoutGender, unassignedSplits } from '../../../core/timer/session-splits';
import { TimerPublishState } from '../../../core/timer/timer-session.enum';
import { TimerSession } from '../../../core/timer/timer-session.interface';
import { AdminTokenService } from '../../../github/admin-token.service';
import { TimerPublishStep } from '../../../state/timer-publish.enum';
import { TimerPublishService } from '../../../state/timer-publish.service';
import { TimerSessionService } from '../../../state/timer-session.service';
import { ADMIN_PAGE_LINK, RACE_PAGE_PREFIX } from '../../admin/admin-page.constant';
import { TimerConfirm } from '../confirm-dialog/confirm-dialog';
import { removeSessionNoteText } from '../session-list/session-list.text';
import { buildTimerSessionRow } from '../session-list/session-list.view';
import { PREVIEW_PAGE_LINK, TIMER_ADMIN_RETURN_PARAMS, TIMER_PUBLISH_NOTHING } from './session-publish.constant';
import { emptyRosterText, unknownGenderText, unnamedTimesText } from './session-publish.text';
import { buildStepView } from './session-publish.view';

/**
 * The one button the race ends with (docs/TIMER.md §8). With a key it publishes the measurement; a
 * guest's press only confirms what already happened by itself — every change went to localStorage the
 * moment it was made — and offers the way to a key. Neither path asks anything else: the requisites,
 * the race number and the notes are the pipeline's business, not the organiser's.
 *
 * Two things are said out loud before saving instead of being swallowed: times still waiting for a
 * name (they can be sorted out or dropped on purpose) and runners without a gender — the latter
 * blocks the publication, because a missing gender costs a person their place in the protocol.
 */
@Component({
  selector: 'app-timer-publish',
  imports: [RouterLink, TimerConfirm],
  templateUrl: './session-publish.html',
  styleUrl: './session-publish.scss',
})
export class TimerPublish {
  readonly #publish = inject(TimerPublishService);
  readonly #sessions = inject(TimerSessionService);
  readonly #adminToken = inject(AdminTokenService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #view = inject(DOCUMENT).defaultView;

  readonly session = input.required<TimerSession>();

  /** «Разобрать» — the page takes the organiser to the queue; the card resolves nothing itself. */
  readonly queue = output<void>();

  protected readonly steps = TimerPublishStep;
  protected readonly previewLink = PREVIEW_PAGE_LINK;
  protected readonly adminLink = ADMIN_PAGE_LINK;
  protected readonly adminReturnParams = TIMER_ADMIN_RETURN_PARAMS;
  protected readonly isAdmin = this.#adminToken.isAdmin;
  protected readonly step = this.#publish.step;
  protected readonly error = this.#publish.error;

  /** True from «Сохранить» until the deploy lands — the progress list is on screen. */
  protected readonly working = computed(() => this.#publish.state() === TimerPublishState.pending);

  protected readonly notesStep = computed(() => buildStepView(this.step(), TimerPublishStep.notes));
  protected readonly commitStep = computed(() => buildStepView(this.step(), TimerPublishStep.committing));
  protected readonly deployStep = computed(() => buildStepView(this.step(), TimerPublishStep.deploying));

  /** The published race's page; null until the commit went through. */
  protected readonly raceLink = computed(() => {
    const slug = this.#publish.publishedSlug();

    return slug === null ? null : `${RACE_PAGE_PREFIX}${slug}`;
  });

  protected readonly unnamedCount = computed(() => unassignedSplits(this.session()).length);
  protected readonly hasUnnamed = computed(() => this.unnamedCount() > TIMER_PUBLISH_NOTHING);
  protected readonly unnamedText = computed(() => unnamedTimesText(this.unnamedCount()));
  protected readonly missingGenderCount = computed(() => runnersWithoutGender(this.session()).length);

  /** A race nobody ran is not a protocol: an empty roster stops «Сохранить» before a gender ever can. */
  protected readonly isEmpty = computed(() => this.session().runners.length === TIMER_PUBLISH_NOTHING);

  /** A person without a gender has no place in the protocol, so the publication waits for them. */
  protected readonly blocked = computed(() => this.isEmpty() || this.missingGenderCount() > TIMER_PUBLISH_NOTHING);
  protected readonly blockedText = computed(() => (this.isEmpty() ? emptyRosterText() : unknownGenderText(this.missingGenderCount())));

  /** The measurement can be thrown away right here — a test run must not need a trip to the list. */
  protected readonly canRemove = computed(() => this.step() !== TimerPublishStep.done && !this.working());
  protected readonly removeAsk = signal(false);
  protected readonly removeNote = computed(() => {
    const row = buildTimerSessionRow(this.session());

    return removeSessionNoteText(row.dateText, row.metaText);
  });

  /** A guest's «Сохранить» has nothing to send — it only confirms what localStorage already holds. */
  protected readonly savedLocally = signal(false);

  /** The network came back after a failure: the organiser is offered the retry, never published behind their back. */
  protected readonly retryOffered = signal(false);

  constructor() {
    const view = this.#view;

    if (view === null) {
      return;
    }

    const onOnline = (): void => {
      if (this.step() === TimerPublishStep.failed) {
        this.retryOffered.set(true);
      }
    };

    view.addEventListener('online', onOnline);
    this.#destroyRef.onDestroy(() => view.removeEventListener('online', onOnline));
  }

  protected onSave(): void {
    if (this.blocked()) {
      return;
    }

    if (!this.isAdmin()) {
      this.savedLocally.set(true);

      return;
    }

    void this.#publish.publish(this.session());
  }

  protected onRetry(): void {
    this.retryOffered.set(false);
    this.onSave();
  }

  /** Drops every time still waiting for a name — deliberately, and only from this button. */
  protected onDiscardUnnamed(): void {
    this.#sessions.update(this.session().id, (session) =>
      unassignedSplits(session).reduce((current, split) => removeSplit(current, split.id), session),
    );
  }

  protected onResolveQueue(): void {
    this.queue.emit();
  }

  /** «Передумал и тестил забег»: the measurement goes, and the page falls back to «Мои замеры». */
  protected onRemove(): void {
    this.removeAsk.set(false);
    this.#sessions.remove(this.session().id);
  }
}

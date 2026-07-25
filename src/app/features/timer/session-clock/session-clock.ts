import { Component, computed, effect, inject, output, signal } from '@angular/core';

import { formatRussianDateChip } from '../../../core/time/russian-date';
import { startSession, stopSession } from '../../../core/timer/session-actions';
import { bestFinishMs, finishDoneCount, isRaceComplete, lapDoneCount } from '../../../core/timer/session-splits';
import { TimerStatus } from '../../../core/timer/timer-session.enum';
import { TimerSession } from '../../../core/timer/timer-session.interface';
import { TimerFeedback } from '../../../state/haptics.enum';
import { HapticsService } from '../../../state/haptics.service';
import { TimerClockService } from '../../../state/timer-clock.service';
import { TimerSessionService } from '../../../state/timer-session.service';
import { WakeLockService } from '../../../state/wake-lock.service';
import { TimerFarewellService } from '../timer-farewell.service';
import { formatTimerFigure, formatTimerFraction } from './clock-figure';
import { TIMER_PROGRESS_EMPTY } from './session-clock.constant';
import { TimerSummaryView } from './session-clock.interface';
import { bestFinishText, finishedCountText } from './session-clock.text';

/**
 * The single light source of the cockpit: the figure, one key, the two counters and the live bar of
 * the race. The figure is `aria-hidden` and repaints ten times a second, so it is never announced;
 * the counters below it are the polite live region that tells a screen reader where the race stands.
 */
@Component({
  selector: 'app-timer-clock',
  templateUrl: './session-clock.html',
  styleUrl: './session-clock.scss',
})
export class TimerClock {
  readonly #sessions = inject(TimerSessionService);
  readonly #clock = inject(TimerClockService);
  readonly #haptics = inject(HapticsService);
  readonly #wakeLock = inject(WakeLockService);
  readonly #farewell = inject(TimerFarewellService);

  /** «Сначала соберите состав» — the clock cannot open the roster sheet, the page can. */
  readonly roster = output<void>();

  protected readonly statuses = TimerStatus;
  protected readonly session = this.#sessions.active;
  protected readonly figure = computed(() => formatTimerFigure(this.#clock.elapsedMs()));
  /** Drawn as its own span: same figure, half the size, so the seconds keep the eye. */
  protected readonly fraction = computed(() => formatTimerFraction(this.#clock.elapsedMs()));
  protected readonly total = computed(() => this.session()?.runners.length ?? TIMER_PROGRESS_EMPTY);
  protected readonly lapDone = computed(() => {
    const session = this.session();

    return session === null ? TIMER_PROGRESS_EMPTY : lapDoneCount(session);
  });

  protected readonly finishDone = computed(() => {
    const session = this.session();

    return session === null ? TIMER_PROGRESS_EMPTY : finishDoneCount(session);
  });

  /**
   * A race with nobody in it cannot be started — the core refuses it and so does the key, because a
   * running clock over an empty roster ends as an empty protocol offered for publication.
   */
  protected readonly canStart = computed(() => this.total() > TIMER_PROGRESS_EMPTY);

  /** Why «Старт» is dead, shown only where it can be fixed: before the mass start. */
  protected readonly rosterNeeded = computed(() => this.session()?.status === TimerStatus.idle && !this.canStart());

  /** `scaleX()` of the race bar, `0…1`; an empty roster has no progress to show. */
  protected readonly progress = computed(() => {
    const total = this.total();

    return `${total === TIMER_PROGRESS_EMPTY ? TIMER_PROGRESS_EMPTY : this.finishDone() / total}`;
  });

  /** The screen may dim on its own here: no lock to take, so the organiser is told to set a longer one. */
  protected readonly wakeUnsupported = this.#wakeLock.unsupported;

  /**
   * What the counters turn into once the last runner is home (docs/TIMER.md §10). The figure and
   * «Стоп» stay exactly where they are — the clock still has to be stoppable — but «круг: 15 из 15»
   * has nothing left to say, so the line under the digits becomes the result of the race instead.
   */
  protected readonly summary = computed<TimerSummaryView | null>(() => {
    const session = this.session();
    const best = session === null || !this.#farewell.settled() ? null : bestFinishMs(session);

    if (session === null || best === null) {
      return null;
    }

    return {
      bestText: bestFinishText(best),
      dateText: formatRussianDateChip(session.dateIso),
      finishedText: finishedCountText(finishDoneCount(session)),
    };
  });

  /** Set once the race is under way, so the figure plays its «просыпается» animation exactly once. */
  protected readonly woke = signal(false);

  /** Whether the interval is running right now, so a tap does not restart the tick on every split. */
  #ticking = false;

  /**
   * The digits follow the status of the measurement rather than a sequence of calls: a race restored
   * from localStorage picks its tick up on its own, and a race resumed by «Отменить» after the
   * automatic stop does too.
   *
   * And the stop itself lives here: the moment every runner is home or retired there is nothing left
   * to time, so the clock stops itself instead of running on over a finished race until somebody
   * remembers the key (docs/TIMER.md §14). It stays reversible — undoing the last tap puts the race
   * back on the clock.
   */
  constructor() {
    effect(() => {
      const session = this.#sessions.active();

      if (session?.status !== TimerStatus.running) {
        this.#idle();

        return;
      }

      if (isRaceComplete(session)) {
        this.#finish(session);

        return;
      }

      this.#run(session);
    });
  }

  /** Public for the specs: a disabled key cannot be clicked, and the refusal has to be provable. */
  onStart(session: TimerSession): void {
    if (!this.canStart()) {
      return;
    }

    this.#haptics.play(TimerFeedback.start);
    this.#launch(session);
  }

  protected onStop(session: TimerSession): void {
    this.#finish(session);
  }

  /** The race is over — by the key or by the last runner. Same three things happen either way. */
  #finish(session: TimerSession): void {
    const stoppedAtMs = this.#clock.elapsedMs();

    this.#idle();
    this.#sessions.updateActive(() => stopSession(session, stoppedAtMs));
    this.#haptics.play(TimerFeedback.finish);
  }

  #run(session: TimerSession): void {
    if (this.#ticking) {
      return;
    }

    this.#ticking = true;
    this.#clock.start(session);
    this.#wakeLock.request();
  }

  #idle(): void {
    if (!this.#ticking) {
      return;
    }

    this.#ticking = false;
    this.#clock.stop();
    this.#wakeLock.release();
  }

  /**
   * The wall clock is read exactly here and only to anchor the date; every split is measured against
   * the monotonic base the clock service sets up from this same stamp. The stamp is handed to the
   * clock inside a fresh copy rather than read back from the store, so a roster change made just
   * before the tap is not overwritten by a session captured earlier.
   */
  #launch(session: TimerSession): void {
    const startedAtEpochMs = Date.now();

    this.#ticking = true;
    this.#sessions.updateActive((current) => startSession(current, startedAtEpochMs));
    this.#clock.start({ ...session, startedAtEpochMs });
    this.#wakeLock.request();
    this.woke.set(true);
  }
}

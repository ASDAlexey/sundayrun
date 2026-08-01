import { Component, computed, inject, output } from '@angular/core';

import { formatRussianDateChip } from '../../../core/time/russian-date';
import { bestFinishMs, finishDoneCount, lapDoneCount } from '../../../core/timer/session-splits';
import { TimerStatus } from '../../../core/timer/timer-session.enum';
import { TimerClockService } from '../../../state/timer-clock.service';
import { TimerRaceService } from '../../../state/timer-race.service';
import { TimerSessionService } from '../../../state/timer-session.service';
import { WakeLockService } from '../../../state/wake-lock.service';
import { TimerFarewellService } from '../timer-farewell.service';
import { formatTimerFigure, formatTimerFraction } from './clock-figure';
import { TIMER_PROGRESS_EMPTY } from './session-clock.constant';
import { TimerSummaryView } from './session-clock.interface';
import { bestFinishText, finishedCountText } from './session-clock.text';

/**
 * The single light source of the cockpit: the figure, the two counters and the live bar of the race.
 * The figure is `aria-hidden` and repaints ten times a second, so it is never announced; the counters
 * below it are the polite live region that tells a screen reader where the race stands. The key that
 * starts and stops it all stands on the floor of the screen instead — see `race-key`.
 *
 * Nothing here drives the measurement: the component only reads. Following the life of a race — the
 * tick, the wake lock, the automatic stop — is `TimerRaceService`'s own effect, because this view is
 * torn down the moment the cockpit closes and an effect that dies with it never sees the closing.
 */
@Component({
  selector: 'app-timer-clock',
  templateUrl: './session-clock.html',
  styleUrl: './session-clock.scss',
})
export class TimerClock {
  readonly #sessions = inject(TimerSessionService);
  readonly #clock = inject(TimerClockService);
  readonly #race = inject(TimerRaceService);
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
  protected readonly woke = this.#race.woke;
  protected readonly lapDone = computed(() => {
    const session = this.session();

    return session === null ? TIMER_PROGRESS_EMPTY : lapDoneCount(session);
  });

  protected readonly finishDone = computed(() => {
    const session = this.session();

    return session === null ? TIMER_PROGRESS_EMPTY : finishDoneCount(session);
  });

  /** Why «Старт» is dead, shown only where it can be fixed: before the mass start. */
  protected readonly rosterNeeded = computed(() => this.session()?.status === TimerStatus.idle && !this.#race.canStart());

  /** `scaleX()` of the race bar, `0…1`; an empty roster has no progress to show. */
  protected readonly progress = computed(() => {
    const total = this.total();

    return `${total === TIMER_PROGRESS_EMPTY ? TIMER_PROGRESS_EMPTY : this.finishDone() / total}`;
  });

  /** The screen may dim on its own here: no lock to take, so the organiser is told to set a longer one. */
  protected readonly wakeUnsupported = this.#wakeLock.unsupported;

  /**
   * What the counters turn into once the last runner is home (docs/TIMER.md §10). The figure stays
   * exactly where it is, but «круг: 15 из 15» has nothing left to say, so the line under the digits
   * becomes the result of the race instead.
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
}

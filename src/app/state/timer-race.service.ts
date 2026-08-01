import { Service, computed, effect, inject, signal } from '@angular/core';

import { startSession, stopSession } from '../core/timer/session-actions';
import { isRaceComplete } from '../core/timer/session-splits';
import { TimerStatus } from '../core/timer/timer-session.enum';
import { TimerSession } from '../core/timer/timer-session.interface';
import { TimerFeedback } from './haptics.enum';
import { HapticsService } from './haptics.service';
import { TIMER_CLOCK_IDLE_MS } from './timer-clock.constant';
import { TimerClockService } from './timer-clock.service';
import { TIMER_EMPTY_ROSTER } from './timer-race.constant';
import { TimerSessionService } from './timer-session.service';
import { WakeLockService } from './wake-lock.service';

/**
 * The mass start and the stop, held apart from the two places that press them: the digits at the top
 * of the cockpit read the state of the race, the round key on its floor is what a thumb reaches. Both
 * would otherwise carry their own copy of the launch, and a race started twice is a race lost.
 */
@Service()
export class TimerRaceService {
  readonly #sessions = inject(TimerSessionService);
  readonly #clock = inject(TimerClockService);
  readonly #haptics = inject(HapticsService);
  readonly #wakeLock = inject(WakeLockService);

  /** Set once the race is under way, so the figure plays its «просыпается» animation exactly once. */
  readonly woke = signal(false);

  /**
   * A race with nobody in it cannot be started — the core refuses it and so does the key, because a
   * running clock over an empty roster ends as an empty protocol offered for publication.
   */
  readonly canStart = computed(() => (this.#sessions.active()?.runners.length ?? TIMER_EMPTY_ROSTER) > TIMER_EMPTY_ROSTER);

  /** Whether the interval is running right now, so a tap does not restart the tick on every split. */
  #ticking = false;

  /**
   * Watching the measurement is the job of whoever owns the clock, so it is done here rather than in
   * the view that shows the digits. It used to live in `TimerClock`'s constructor, and that component
   * sits inside `@if (session(); as current)`: «←» closed the cockpit and destroyed the effect's view
   * in the same template pass, so the effect never got to run with `null` — the wake lock was never
   * given back and the 30 ms interval kept ticking behind a screen nobody was looking at.
   *
   * The service is still built lazily, on the first cockpit that injects it; from then on it is a
   * root singleton and outlives every view of the timer.
   */
  constructor() {
    effect(() => this.#sync(this.#sessions.active()));
  }

  /** Public so the specs can prove the refusal: a disabled key cannot be clicked. */
  start(session: TimerSession): void {
    if (!this.canStart()) {
      return;
    }

    this.#haptics.play(TimerFeedback.start);
    this.#launch(session);
  }

  stop(session: TimerSession): void {
    this.#finish(session);
  }

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
  #sync(session: TimerSession | null): void {
    if (session?.status !== TimerStatus.running) {
      this.#idle();
      // Nothing is ticking here, so the digits have to be told what to show: how long the race took
      // if it is over, and zero for one that has not started. Reopening a finished measurement
      // otherwise puts «00:00,00» over a line that says five people finished.
      this.#clock.freeze(session?.stoppedAtMs ?? TIMER_CLOCK_IDLE_MS);

      return;
    }

    if (isRaceComplete(session)) {
      this.#finish(session);

      return;
    }

    this.#run(session);
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

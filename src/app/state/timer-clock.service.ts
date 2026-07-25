import { DOCUMENT, Injectable, OnDestroy, inject, signal } from '@angular/core';

import { TimerSession } from '../core/timer/timer-session.interface';
import { TIMER_CLOCK_IDLE_MS, TIMER_TICK_INTERVAL_MS } from './timer-clock.constant';

/**
 * The race clock. Elapsed time is measured against `performance.now()`, never against the wall clock:
 * a timezone change, an NTP correction or a sleeping tab must not move a split that is already written
 * down. The wall clock is read exactly once per start, and only to work out how much of the race had
 * already run — a session restored from localStorage rebuilds its base as
 * `performance.now() - (Date.now() - startedAtEpochMs)`, so the digits continue where the dropped tab
 * left them while every recorded `atMs` keeps its meaning.
 */
@Injectable({ providedIn: 'root' })
export class TimerClockService implements OnDestroy {
  readonly #view = inject(DOCUMENT).defaultView;
  readonly #elapsedMs = signal(TIMER_CLOCK_IDLE_MS);

  /** Ticks every 30 ms while the race runs, freezes on `stop` at the time the race ended. */
  readonly elapsedMs = this.#elapsedMs.asReadonly();

  #baseMs: number | null = null;
  #stopTick: (() => void) | null = null;

  ngOnDestroy(): void {
    this.stop();
  }

  /** Sets the base off the session's own start stamp and starts ticking; restarting is safe. */
  start(session: TimerSession): void {
    this.stop();
    this.#baseMs = this.#baseFor(session);
    this.#tick();

    const view = this.#view;

    if (view === null) {
      return;
    }

    const tickId = view.setInterval(() => this.#tick(), TIMER_TICK_INTERVAL_MS);

    this.#stopTick = () => view.clearInterval(tickId);
  }

  /** Stops the repaint; the base survives, so a split recorded right after a stop still lands right. */
  stop(): void {
    this.#stopTick?.();
    this.#stopTick = null;
  }

  /** Monotonic «сейчас» since the mass start — the `atMs` of a split, read inside `pointerdown`. */
  nowMs(): number {
    if (this.#baseMs === null) {
      return TIMER_CLOCK_IDLE_MS;
    }

    return Math.max(TIMER_CLOCK_IDLE_MS, Math.round(this.#monotonicMs() - this.#baseMs));
  }

  /** A session that has not started yet is at zero; one restored mid-race resumes where it was. */
  #baseFor(session: TimerSession): number {
    const monotonicMs = this.#monotonicMs();

    if (session.startedAtEpochMs === null) {
      return monotonicMs;
    }

    return monotonicMs - (this.#epochMs() - session.startedAtEpochMs);
  }

  #tick(): void {
    this.#elapsedMs.set(this.nowMs());
  }

  #monotonicMs(): number {
    return this.#view?.performance.now() ?? TIMER_CLOCK_IDLE_MS;
  }

  #epochMs(): number {
    return this.#view?.Date.now() ?? TIMER_CLOCK_IDLE_MS;
  }
}

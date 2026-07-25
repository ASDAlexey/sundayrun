import { DOCUMENT, Injectable, OnDestroy, inject, signal } from '@angular/core';

import { REDUCED_MOTION_QUERY, TIMER_COUNTDOWN_FROM, TIMER_COUNTDOWN_LAUNCH, TIMER_COUNTDOWN_STEP_MS } from './session-clock.constant';

/**
 * The 3-2-1 before the mass start. It lives in a service rather than in the clock component for one
 * reason: it owns a timer, and every timer in this project is taken from the injected window so that
 * a prerender has none and a spec can drive one by hand.
 *
 * Somebody who asked the system for less motion gets no countdown at all — the design spec calls the
 * whole ceremony off in that case rather than playing it without animation, because the three
 * silent, motionless seconds would read as the app hanging.
 */
@Injectable({ providedIn: 'root' })
export class TimerCountdownService implements OnDestroy {
  readonly #view = inject(DOCUMENT).defaultView;
  readonly #value = signal<number | null>(null);

  /** 3, 2 or 1 while the veil is up; null whenever there is nothing on screen. */
  readonly value = this.#value.asReadonly();

  #remaining = TIMER_COUNTDOWN_LAUNCH;
  #stop: (() => void) | null = null;

  ngOnDestroy(): void {
    this.cancel();
  }

  /** Counts down and then launches. Reduced motion — and a prerender — launch straight away. */
  run(launch: () => void): void {
    this.cancel();

    const view = this.#view;

    if (view === null || view.matchMedia(REDUCED_MOTION_QUERY).matches) {
      launch();

      return;
    }

    this.#remaining = TIMER_COUNTDOWN_FROM;
    this.#value.set(this.#remaining);

    const tickId = view.setInterval(() => this.#step(launch), TIMER_COUNTDOWN_STEP_MS);

    this.#stop = () => view.clearInterval(tickId);
  }

  /** Takes the veil down without starting anything — «Стоп» during the ceremony, or a teardown. */
  cancel(): void {
    this.#stop?.();
    this.#stop = null;
    this.#value.set(null);
  }

  #step(launch: () => void): void {
    this.#remaining -= 1;

    if (this.#remaining <= TIMER_COUNTDOWN_LAUNCH) {
      this.cancel();
      launch();

      return;
    }

    this.#value.set(this.#remaining);
  }
}

import { DOCUMENT, OnDestroy, Service, computed, effect, inject, signal } from '@angular/core';

import { isRaceComplete } from '../../core/timer/session-splits';
import { TimerSessionService } from '../../state/timer-session.service';
import { REDUCED_MOTION_QUERY } from './session-clock/session-clock.constant';
import { TIMER_FAREWELL_WAVE_MS } from './timer-farewell.constant';
import { TimerFarewellPhase, TimerFarewellPhaseType } from './timer-farewell.enum';

/**
 * «Последний финишировавший» — the single orchestrated animation of a race (docs/TIMER.md §10). The
 * moment the last runner is home or retired, the tiles go out in a wave from the top row down, and
 * when the wave is over the finished protocol takes their place. Everything else on this screen has
 * to be dull and fast; this is the one place where the instrument is allowed to say «всё».
 *
 * It lives in a service because it owns a timer, and every timer in this project comes from the
 * injected window so that a prerender has none and a spec can drive one by hand. Somebody who asked
 * the system for less motion skips the wave altogether and gets the protocol at once — the point of
 * the wave is the transition, and without motion there is nothing left of it to play.
 *
 * Undoing the last split puts the race back in progress, and the ceremony is armed again with it.
 */
@Service()
export class TimerFarewellService implements OnDestroy {
  readonly #view = inject(DOCUMENT).defaultView;
  readonly #sessions = inject(TimerSessionService);
  readonly #phase = signal<TimerFarewellPhaseType>(TimerFarewellPhase.idle);

  /** The tiles are going out; the grid has to stay on screen for exactly as long as this is true. */
  readonly waving = computed(() => this.#phase() === TimerFarewellPhase.waving);

  /** The wave is behind us: the protocol is the thing to look at now. */
  readonly settled = computed(() => this.#phase() === TimerFarewellPhase.settled);

  #played = false;
  #stop: (() => void) | null = null;

  constructor() {
    effect(() => {
      const session = this.#sessions.active();

      if (session === null || !isRaceComplete(session)) {
        this.#reset();

        return;
      }

      if (!this.#played) {
        this.#played = true;
        this.#play();
      }
    });
  }

  ngOnDestroy(): void {
    this.#reset();
  }

  #play(): void {
    const view = this.#view;

    if (view === null || view.matchMedia(REDUCED_MOTION_QUERY).matches) {
      this.#phase.set(TimerFarewellPhase.settled);

      return;
    }

    this.#phase.set(TimerFarewellPhase.waving);

    const waveId = view.setTimeout(() => this.#phase.set(TimerFarewellPhase.settled), TIMER_FAREWELL_WAVE_MS);

    this.#stop = () => view.clearTimeout(waveId);
  }

  #reset(): void {
    this.#stop?.();
    this.#stop = null;
    this.#played = false;
    this.#phase.set(TimerFarewellPhase.idle);
  }
}

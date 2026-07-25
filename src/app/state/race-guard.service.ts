import { DOCUMENT, Service, effect, inject } from '@angular/core';

import { TimerStatus } from '../core/timer/timer-session.enum';
import { BEFORE_UNLOAD_EVENT, TIMER_LEAVE_CONFIRM } from './race-guard.constant';
import { TimerSessionService } from './timer-session.service';

/**
 * The two ways out of a running race, both of them one careless thumb wide (docs/TIMER.md §11).
 *
 * The cockpit is `position: fixed` over the whole viewport, so «←» is the only visible exit — and the
 * system «назад» is the invisible one. Both go through `confirmLeave`, which is also what the route's
 * `CanDeactivate` asks. Closing the tab outright is not ours to intercept, so a `beforeunload`
 * listener raises the browser's own dialog instead, and is taken off again the moment the clock stops.
 *
 * Nothing here protects the data: every split is in localStorage before the finger leaves the tile,
 * and a reopened measurement resumes with the clock still running. What it protects is the judge's
 * attention — coming back to the screen costs seconds that the pack does not wait out.
 */
@Service()
export class RaceGuardService {
  readonly #view = inject(DOCUMENT).defaultView;
  readonly #sessions = inject(TimerSessionService);

  constructor() {
    const view = this.#view;

    if (view === null) {
      return;
    }

    const onUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
    };

    effect((onCleanup) => {
      if (!this.#running()) {
        return;
      }

      view.addEventListener(BEFORE_UNLOAD_EVENT, onUnload);
      onCleanup(() => view.removeEventListener(BEFORE_UNLOAD_EVENT, onUnload));
    });
  }

  /** Whether the screen may be left: no race is running, or the organiser said so out loud. */
  confirmLeave(): boolean {
    if (!this.#running()) {
      return true;
    }

    return this.#view?.confirm(TIMER_LEAVE_CONFIRM) ?? true;
  }

  #running(): boolean {
    return this.#sessions.active()?.status === TimerStatus.running;
  }
}

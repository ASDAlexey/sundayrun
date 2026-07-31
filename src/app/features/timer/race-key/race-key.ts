import { Component, computed, inject } from '@angular/core';

import { TimerStatus } from '../../../core/timer/timer-session.enum';
import { TimerSession } from '../../../core/timer/timer-session.interface';
import { TimerRaceService } from '../../../state/timer-race.service';
import { TimerSessionService } from '../../../state/timer-session.service';

/**
 * The one key of the cockpit, on the floor of the screen where a thumb already is. It was a small
 * rectangle beside the digits, at the top right — the corner a phone held one-handed cannot reach,
 * and the corner the eye is least likely to search for the most important control of the race.
 *
 * «Старт» and «Стоп» are the same key rather than two: one place to look, and no chance of pressing
 * the wrong one at the mass start.
 */
@Component({
  selector: 'app-timer-race-key',
  templateUrl: './race-key.html',
  styleUrl: './race-key.scss',
})
export class TimerRaceKey {
  readonly #sessions = inject(TimerSessionService);
  readonly #race = inject(TimerRaceService);

  protected readonly statuses = TimerStatus;
  protected readonly session = this.#sessions.active;
  protected readonly canStart = this.#race.canStart;

  /** A finished race has nothing left to press — the key steps aside for «Сохранить». */
  protected readonly shown = computed(() => {
    const status = this.session()?.status;

    return status === TimerStatus.idle || status === TimerStatus.running;
  });

  protected onPress(session: TimerSession): void {
    if (session.status === TimerStatus.running) {
      this.#race.stop(session);

      return;
    }

    this.#race.start(session);
  }
}

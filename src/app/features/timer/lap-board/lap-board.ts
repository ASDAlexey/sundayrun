import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { buildLapBoard } from '../../../core/timer/session-lap-board';
import { TimerRosterService } from '../../../state/timer-roster.service';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TIMER_LAP_NOBODY_PENDING } from './lap-board.constant';
import { TimerLapMark } from './lap-board.enum';
import { TimerLapRow } from './lap-board.interface';
import { pendingLapText } from './lap-board.text';
import { buildLapRows } from './lap-rows';

/**
 * The live «Первый круг» table (docs/TIMER.md §4): who is through the 2.3 km and how far behind the
 * leader of the lap, while everybody is still out on the second one. The order itself comes from the
 * core — this component only joins it with what the archive knows about those runners and hands the
 * result to the template, where a row slides to its new place instead of being redrawn.
 */
@Component({
  selector: 'app-timer-lap-board',
  templateUrl: './lap-board.html',
  styleUrl: './lap-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerLapBoard {
  readonly #sessions = inject(TimerSessionService);
  readonly #roster = inject(TimerRosterService);

  readonly rows = computed<TimerLapRow[]>(() => {
    const session = this.#sessions.active();

    if (session === null) {
      return [];
    }

    return buildLapRows({
      bestLapMs: this.#roster.bestLapMs(),
      board: buildLapBoard(session),
      courseRecordLapMs: this.#roster.courseRecordLapMs(),
      runners: session.runners,
    });
  });

  readonly hasRows = computed(() => this.rows().length > 0);

  /** «ещё 7 не прошли круг» — null once the whole roster is through the lap. */
  readonly pendingText = computed(() => {
    const pending = (this.#sessions.active()?.runners.length ?? TIMER_LAP_NOBODY_PENDING) - this.rows().length;

    return pending > TIMER_LAP_NOBODY_PENDING ? pendingLapText(pending) : null;
  });

  protected readonly marks = TimerLapMark;
}

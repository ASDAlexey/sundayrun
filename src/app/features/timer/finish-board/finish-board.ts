import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { formatDuration } from '../../../core/time/duration';
import { unassignedSplits } from '../../../core/timer/session-splits';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TIMER_FINISH_NOTHING_UNASSIGNED } from './finish-board.constant';
import { TimerFinishRow } from './finish-board.interface';
import { unassignedTimesText } from './finish-board.text';
import { buildFinishRows } from './finish-rows';

/**
 * The «Финиш» tab: the ready protocol in the shape it will go to the site — place per gender, name,
 * 2.3 km, 5 km, pace — plus the times that are still waiting for a name, which the organiser has to
 * either attach or throw away before saving (docs/TIMER.md §4).
 */
@Component({
  selector: 'app-timer-finish-board',
  templateUrl: './finish-board.html',
  styleUrl: './finish-board.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerFinishBoard {
  readonly #sessions = inject(TimerSessionService);

  readonly rows = computed<TimerFinishRow[]>(() => {
    const session = this.#sessions.active();

    return session === null ? [] : buildFinishRows(session);
  });

  readonly hasRows = computed(() => this.rows().length > 0);

  readonly unassignedTimes = computed<string[]>(() => {
    const session = this.#sessions.active();

    return session === null ? [] : unassignedSplits(session).map((split) => formatDuration(split.atMs));
  });

  /** «2 времени без имени» — null once the queue is empty. */
  readonly unassignedText = computed(() => {
    const count = this.unassignedTimes().length;

    return count === TIMER_FINISH_NOTHING_UNASSIGNED ? null : unassignedTimesText(count);
  });
}

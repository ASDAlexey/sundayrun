import { leaderGapsMs } from '../../../core/history/leader-gaps';
import { type ProtocolRow } from '../../../core/models/protocol-row.interface';
import { paceTextOf } from '../../../core/protocol/pace-text';
import { buildProtocolRows } from '../../../core/protocol/protocol-builder';
import { EMPTY_TIME } from '../../../core/protocol/protocol-builder.constant';
import { formatRaceTime } from '../../../core/time/duration';
import { sessionToParticipants } from '../../../core/timer/session-to-participants';
import { type TimerSession } from '../../../core/timer/timer-session.interface';
import { TIMER_FINISH_GAP_PREFIX, TIMER_FINISH_NO_GAP_TEXT, TIMER_FINISH_NO_PLACE_TEXT } from './finish-board.constant';
import { type TimerFinishRow } from './finish-board.interface';

/**
 * The protocol exactly as it will leave for the site. Nothing is recomputed here: the session becomes
 * `Participant[]` and goes through the very same `buildProtocolRows` the publish path uses, so the
 * screen the organiser signs off on and the archive can never drift apart (docs/TIMER.md §3, §4).
 */
export function buildFinishRows(session: TimerSession): TimerFinishRow[] {
  const rows = buildProtocolRows(sessionToParticipants(session));
  const gapsMs = leaderGapsMs(rows);

  return rows.map((row, index) => toFinishRow(row, gapsMs[index]));
}

function toFinishRow(row: ProtocolRow, gapMs: number | null): TimerFinishRow {
  const place = row.placeM ?? row.placeF;

  return {
    fullName: row.fullName,
    gapText: gapMs === null ? TIMER_FINISH_NO_GAP_TEXT : TIMER_FINISH_GAP_PREFIX + formatRaceTime(gapMs),
    index: row.index,
    out: row.time5 === EMPTY_TIME,
    paceText: paceTextOf(row.totalMs, row.distanceKm),
    placeText: place === null ? TIMER_FINISH_NO_PLACE_TEXT : String(place),
    time23: row.time23,
    time5: row.time5,
  };
}

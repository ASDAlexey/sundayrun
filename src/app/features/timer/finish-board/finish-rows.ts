import { paceTextOf } from '../../../core/protocol/pace-text';
import { buildProtocolRows } from '../../../core/protocol/protocol-builder';
import { EMPTY_TIME } from '../../../core/protocol/protocol-builder.constant';
import { ProtocolRow } from '../../../core/models/protocol-row.interface';
import { sessionToParticipants } from '../../../core/timer/session-to-participants';
import { TimerSession } from '../../../core/timer/timer-session.interface';
import { TIMER_FINISH_NO_PLACE_TEXT } from './finish-board.constant';
import { TimerFinishRow } from './finish-board.interface';

/**
 * The protocol exactly as it will leave for the site. Nothing is recomputed here: the session becomes
 * `Participant[]` and goes through the very same `buildProtocolRows` the publish path uses, so the
 * screen the organiser signs off on and the archive can never drift apart (docs/TIMER.md §3, §4).
 */
export function buildFinishRows(session: TimerSession): TimerFinishRow[] {
  return buildProtocolRows(sessionToParticipants(session)).map(toFinishRow);
}

function toFinishRow(row: ProtocolRow): TimerFinishRow {
  const place = row.placeM ?? row.placeF;

  return {
    fullName: row.fullName,
    index: row.index,
    out: row.time5 === EMPTY_TIME,
    paceText: paceTextOf(row.totalMs, row.distanceKm),
    placeText: place === null ? TIMER_FINISH_NO_PLACE_TEXT : String(place),
    time23: row.time23,
    time5: row.time5,
  };
}

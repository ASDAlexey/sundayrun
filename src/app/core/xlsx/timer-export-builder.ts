import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from '../history/distance.constant';
import { Participant } from '../models/participant.interface';
import { FIVE_KM_LAP_COUNT } from '../protocol/protocol-builder.constant';
import { formatDurationPrecise } from '../time/duration';
import { EMPTY_TIME_CELL, FIRST_LAP_INDEX, NO_LAPS, SECOND_LAP_INDEX, TIMER_EXPORT_HEADER_ROW } from './timer-export-builder.constant';

/**
 * Builds the rows of a timer xlsx export (Name, Total, Avg/lap, Avg/km, Lap 1, Lap 2)
 * from participants. Times keep every millisecond, so `parseTimerExport` reads the file
 * back into the very same participants. The two average columns are informational only —
 * the parser ignores them, but a real timer export has them filled in.
 */
export function buildTimerExportRows(participants: Participant[]): string[][] {
  return [[...TIMER_EXPORT_HEADER_ROW], ...participants.map((participant) => buildRow(participant))];
}

function buildRow(participant: Participant): string[] {
  const { totalMs, lapsMs } = participant;
  const lapCount = lapsMs.filter((lapMs) => lapMs !== null).length;
  /** Averages need both a total time and at least one recorded lap to be meaningful. */
  const measuredMs = lapCount === NO_LAPS ? null : totalMs;

  return [
    participant.fullName,
    timeCellOf(totalMs),
    timeCellOf(dividedMs(measuredMs, lapCount)),
    timeCellOf(dividedMs(measuredMs, distanceKmOf(lapCount))),
    timeCellOf(lapsMs[FIRST_LAP_INDEX] ?? null),
    timeCellOf(lapsMs[SECOND_LAP_INDEX] ?? null),
  ];
}

/** Distance covered: two laps mean the full 5 km, a single lap means the 2.3 km split. */
function distanceKmOf(lapCount: number): number {
  return lapCount >= FIVE_KM_LAP_COUNT ? FIVE_KM_DISTANCE_KM : TWO_THREE_KM_DISTANCE_KM;
}

function dividedMs(ms: number | null, divisor: number): number | null {
  return ms === null ? null : ms / divisor;
}

function timeCellOf(ms: number | null): string {
  return ms === null ? EMPTY_TIME_CELL : formatDurationPrecise(ms);
}

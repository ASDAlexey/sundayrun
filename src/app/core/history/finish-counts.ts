import { ProtocolRow } from '../models/protocol-row.interface';
import { normalizeAthleteKey } from './athlete-key';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { ParticipantRun } from './notables.interface';

/**
 * The «Финишей» protocol column, keyed by athlete: how many 5 km finishes the athlete has as of
 * the event date, this event's run included. Cut to the event date like the notables, so an old
 * protocol keeps the tally as it stood on race day; short-course runs never count, matching the
 * athlete page counter. Short-course and DNF participants stay out of the map — their cells
 * render blank.
 */
export function finishCountsAt(participantRuns: ParticipantRun[], dateIso: string): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const run of participantRuns) {
    if (run.distanceKm !== FIVE_KM_DISTANCE_KM || run.dateIso > dateIso) {
      continue;
    }

    counts[run.athleteKey] = (counts[run.athleteKey] ?? 0) + 1;
  }

  return counts;
}

/**
 * The same map at publish time, when the event itself is not in the db yet: every 5 km finisher
 * of `rows` gets their stored count of earlier finishes plus this one. The prior counts must be
 * cut strictly before the event date, so republishing an already-stored event never double-counts.
 */
export function eventFinishCounts(rows: ProtocolRow[], priorCounts: Record<string, number>): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const row of rows) {
    if (row.distanceKm === FIVE_KM_DISTANCE_KM && row.totalMs !== null) {
      const key = normalizeAthleteKey(row.fullName);

      counts[key] = (priorCounts[key] ?? 0) + 1;
    }
  }

  return counts;
}

import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { ParticipantRun } from './notables.interface';
import { PreviousBest } from './previous-bests.interface';

/**
 * The all-time 5 km best per athlete strictly before `dateIso` — the run the stored «ЛР (было X)»
 * note refers to, so the protocol can link the previous record to the race where it was set.
 * A time tie keeps the earlier run, matching the first-setter rule of the course records.
 * Athletes with no earlier 5 km finish are absent.
 *
 * `sinceIso` bounds the window on the other side: pass the first day of the race's year and the
 * same scan answers «лучшее в этом году до забега» instead, which is what the «Δ ЛР» hint compares
 * the all-time record against. Empty — the default — reaches back over the whole archive.
 */
export function buildPreviousBests(participantRuns: ParticipantRun[], dateIso: string, sinceIso = ''): Record<string, PreviousBest> {
  const bests: Record<string, PreviousBest> = {};

  for (const run of participantRuns) {
    if (run.distanceKm !== FIVE_KM_DISTANCE_KM || run.dateIso >= dateIso || run.dateIso < sinceIso) {
      continue;
    }

    const current = bests[run.athleteKey];

    if (current === undefined || run.timeMs < current.timeMs || (run.timeMs === current.timeMs && run.dateIso < current.dateIso)) {
      bests[run.athleteKey] = { slug: run.slug, dateIso: run.dateIso, timeMs: run.timeMs };
    }
  }

  return bests;
}

import { AthletesHistory } from '../models/athletes-history.type';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { OverallStats } from './overall-stats.interface';

/**
 * Site-wide totals over the whole athletes history. Events are counted through
 * `participationSlugs` (every published event has at least one participant), finishers and
 * the averages — through `runs`, so a DNF-only appearance counts the event but not a finish.
 * The average time covers 5 km runs only (like `bestMs`) — mixing distances would skew it.
 */
export function computeOverallStats(history: AthletesHistory): OverallStats {
  const events = new Set<string>();
  let finishesCount = 0;
  let finishersCount = 0;
  let fiveKmCount = 0;
  let fiveKmTotalMs = 0;

  for (const record of Object.values(history)) {
    record.participationSlugs.forEach((slug) => events.add(slug));

    if (record.runs.length > 0) {
      finishersCount += 1;
    }

    finishesCount += record.runs.length;

    for (const run of record.runs) {
      if (run.distanceKm === FIVE_KM_DISTANCE_KM) {
        fiveKmCount += 1;
        fiveKmTotalMs += run.timeMs;
      }
    }
  }

  return {
    eventsCount: events.size,
    finishesCount,
    finishersCount,
    averageFinishes: finishersCount === 0 ? 0 : finishesCount / finishersCount,
    averageTimeMs: fiveKmCount === 0 ? 0 : Math.round(fiveKmTotalMs / fiveKmCount),
  };
}

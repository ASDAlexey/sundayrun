import { AthletesHistory } from '../models/athletes-history.type';
import { Gender } from '../models/gender.enum';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { medianMs } from './median';
import { OverallStats } from './overall-stats.interface';

/**
 * Site-wide totals over the whole athletes history. Events are counted through
 * `participationSlugs` (every published event has at least one participant), finishers and
 * the times — through `runs`, so a DNF-only appearance counts the event but not a finish.
 * The median times cover 5 km runs only (like `bestMs`) — mixing distances would skew them —
 * and are split by gender; athletes with an unknown gender stay out of both medians. A median
 * is used instead of a mean so a handful of walkers cannot drag the typical time.
 */
export function computeOverallStats(history: AthletesHistory): OverallStats {
  const events = new Set<string>();
  let finishesCount = 0;
  let finishersCount = 0;
  const menTimesMs: number[] = [];
  const womenTimesMs: number[] = [];

  for (const record of Object.values(history)) {
    record.participationSlugs.forEach((slug) => events.add(slug));

    if (record.runs.length > 0) {
      finishersCount += 1;
    }

    finishesCount += record.runs.length;

    for (const run of record.runs) {
      if (run.distanceKm !== FIVE_KM_DISTANCE_KM) {
        continue;
      }

      if (record.gender === Gender.male) {
        menTimesMs.push(run.timeMs);
      } else if (record.gender === Gender.female) {
        womenTimesMs.push(run.timeMs);
      }
    }
  }

  return {
    eventsCount: events.size,
    finishesCount,
    finishersCount,
    averageFinishes: finishersCount === 0 ? 0 : finishesCount / finishersCount,
    medianTimeMenMs: medianMs(menTimesMs),
    medianTimeWomenMs: medianMs(womenTimesMs),
  };
}

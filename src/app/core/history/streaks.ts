import { AthleteRun } from '../models/athlete-history.interface';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { RAGE_IMPROVEMENT_COUNT } from './streaks.constant';
import { AthleteStreaks } from './streaks.interface';

/**
 * The weekly loyalty streaks over the event chronology plus the «Раж» counter. `eventSlugs` is
 * every race oldest first; a streak counts consecutive races the athlete showed up to — a DNF
 * participation still extends it (showing up is what the streak rewards), a missed race breaks it.
 * «Раж» (an S95 achievement) is earned each time three 5 km personal records land in a row; a
 * finish that beats no record resets the chain, a 2.3 km run is a different course and neither
 * counts nor breaks it.
 */
export function athleteStreaks(
  participationSlugs: readonly string[],
  runs: readonly AthleteRun[],
  eventSlugs: readonly string[],
): AthleteStreaks {
  const participated = new Set(participationSlugs);
  let trailing = 0;
  let maxWeeks = 0;

  for (const slug of eventSlugs) {
    trailing = participated.has(slug) ? trailing + 1 : 0;

    if (trailing > maxWeeks) {
      maxWeeks = trailing;
    }
  }

  // The run still open at the newest event is by definition the current one.
  return { currentWeeks: trailing, maxWeeks, rageCount: rageCountOf(runs) };
}

/** Replays the 5 km finishes in date order and counts every completed triple of consecutive records. */
function rageCountOf(runs: readonly AthleteRun[]): number {
  const fiveKmRuns = runs
    .filter((run) => run.distanceKm === FIVE_KM_DISTANCE_KM)
    .sort((left, right) => left.dateIso.localeCompare(right.dateIso));
  let bestMs: number | null = null;
  let improvements = 0;
  let rageCount = 0;

  for (const run of fiveKmRuns) {
    if (bestMs === null) {
      // The debut finish seeds the baseline: there is nothing to improve on yet.
      bestMs = run.timeMs;
      continue;
    }

    if (run.timeMs >= bestMs) {
      improvements = 0;
      continue;
    }

    bestMs = run.timeMs;
    improvements += 1;

    if (improvements === RAGE_IMPROVEMENT_COUNT) {
      rageCount += 1;
      improvements = 0;
    }
  }

  return rageCount;
}

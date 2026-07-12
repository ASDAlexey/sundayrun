import { AthleteRun } from '../models/athlete-history.interface';
import { isoYear } from './iso-year';
import {
  ISO_MONTH_END,
  ISO_MONTH_START,
  MONTHS_IN_YEAR,
  OBSESSIVE_BRONZE_RUN_COUNT,
  OBSESSIVE_GOLD_RUN_COUNT,
  OBSESSIVE_SILVER_RUN_COUNT,
} from './year-badges.constant';
import { YearBadge, YearBadgeType } from './year-badges.enum';

/** One year's earned badges; years without any badge are omitted. */
export interface AthleteYearBadges {
  year: string;
  badges: YearBadgeType[];
}

/** What one athlete did within one calendar year, boiled down to the badge criteria. */
export interface YearActivity {
  runCount: number;
  monthCount: number;
  ranNewYearRace: boolean;
}

/**
 * The badges a year's activity earns, in display order: the HIGHEST obsessive tier
 * (50/40/30 finished runs), «все 12 месяцев» (a run in every month), «новогодний забег»
 * (finished the year's first race — the one closest to the New Year holidays).
 */
export function yearBadgesOf(activity: YearActivity): YearBadgeType[] {
  const badges: YearBadgeType[] = [];

  if (activity.runCount >= OBSESSIVE_GOLD_RUN_COUNT) {
    badges.push(YearBadge.obsessiveGold);
  } else if (activity.runCount >= OBSESSIVE_SILVER_RUN_COUNT) {
    badges.push(YearBadge.obsessiveSilver);
  } else if (activity.runCount >= OBSESSIVE_BRONZE_RUN_COUNT) {
    badges.push(YearBadge.obsessiveBronze);
  }

  if (activity.monthCount >= MONTHS_IN_YEAR) {
    badges.push(YearBadge.allMonths);
  }

  if (activity.ranNewYearRace) {
    badges.push(YearBadge.newYearRace);
  }

  return badges;
}

/**
 * Per-year badges of one athlete over their finished runs (any distance — a short-course finish
 * is still a run). `firstEventDateByYear` maps a year to the archive's first race of that year;
 * a year missing from the map simply cannot award the new-year badge. Newest year first.
 */
export function athleteYearBadges(runs: AthleteRun[], firstEventDateByYear: Record<string, string>): AthleteYearBadges[] {
  const byYear = new Map<string, AthleteRun[]>();

  for (const run of runs) {
    const year = isoYear(run.dateIso);
    const yearRuns = byYear.get(year);

    if (yearRuns === undefined) {
      byYear.set(year, [run]);
    } else {
      yearRuns.push(run);
    }
  }

  const result: AthleteYearBadges[] = [];

  for (const [year, yearRuns] of byYear) {
    const badges = yearBadgesOf(toActivity(yearRuns, firstEventDateByYear[year] ?? null));

    if (badges.length > 0) {
      result.push({ year, badges });
    }
  }

  return result.sort((left, right) => right.year.localeCompare(left.year));
}

function toActivity(yearRuns: AthleteRun[], firstEventDate: string | null): YearActivity {
  const months = new Set(yearRuns.map((run) => run.dateIso.slice(ISO_MONTH_START, ISO_MONTH_END)));

  return {
    runCount: yearRuns.length,
    monthCount: months.size,
    ranNewYearRace: firstEventDate !== null && yearRuns.some((run) => run.dateIso === firstEventDate),
  };
}

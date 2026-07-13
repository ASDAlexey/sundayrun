import { Gender, GenderType } from '../models/gender.enum';
import { NAME_COLLATION_LOCALE } from './athletes-list.constant';
import { athleteSignalsOf, badgeSignalsByAthlete } from './badge-signals';
import { AthleteBadgeSignals } from './badge-signals.interface';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { ISO_MONTH_END, ISO_MONTH_START } from './year-badges.constant';
import { medianMsOrNull } from './median';
import { yearBadgesOf } from './year-badges';
import { YearBadge, YearBadgeType } from './year-badges.enum';
import { MOST_ACTIVE_LIMIT, YEAR_BESTS_LIMIT } from './year-review.constant';
import { YearActiveAthlete, YearBadgeHolders, YearBestResult, YearReview, YearReviewSource, YearRunRow } from './year-review.interface';

/** Display order of the badge holder lists on the year review page. */
const BADGE_DISPLAY_ORDER: readonly YearBadgeType[] = [
  YearBadge.obsessiveGold,
  YearBadge.obsessiveSilver,
  YearBadge.obsessiveBronze,
  YearBadge.allMonths,
  YearBadge.newYearRace,
  YearBadge.comeback,
  YearBadge.cameAnyway,
];

/**
 * Boils one year of the archive down to the «Итоги года» page: totals, per-gender medians and
 * best-results boards over the 5 km runs, the most active finishers and every badge holder of
 * the year. All ties break by name in Russian collation, so the lists are stable between loads.
 */
export function buildYearReview(source: YearReviewSource): YearReview {
  const byAthlete = groupByAthlete(source.runRows);
  const fiveKm = source.runRows.filter((row) => row.distanceKm === FIVE_KM_DISTANCE_KM);

  return {
    year: source.year,
    eventCount: source.eventDates.length,
    finishCount: source.runRows.length,
    finisherCount: byAthlete.size,
    newcomerCount: source.newcomerCount,
    personalRecordCount: source.personalRecordCount,
    medianTimeMenMs: medianOf(fiveKm, Gender.male),
    medianTimeWomenMs: medianOf(fiveKm, Gender.female),
    bestMen: bestsOf(fiveKm, Gender.male),
    bestWomen: bestsOf(fiveKm, Gender.female),
    mostActive: mostActiveOf(byAthlete),
    badgeHolders: badgeHoldersOf(byAthlete, source.eventDates[0] ?? null, badgeSignalsByAthlete(source.historyRows), source.year),
    firstEventSlug: source.eventDates[0] ?? null,
  };
}

function groupByAthlete(rows: YearRunRow[]): Map<string, YearRunRow[]> {
  const byAthlete = new Map<string, YearRunRow[]>();

  for (const row of rows) {
    const athleteRows = byAthlete.get(row.key);

    if (athleteRows === undefined) {
      byAthlete.set(row.key, [row]);
    } else {
      athleteRows.push(row);
    }
  }

  return byAthlete;
}

function medianOf(fiveKm: YearRunRow[], gender: GenderType): number | null {
  return medianMsOrNull(
    fiveKm.reduce<number[]>((timesMs, row) => {
      if (row.gender === gender) {
        timesMs.push(row.timeMs);
      }

      return timesMs;
    }, []),
  );
}

/**
 * The year's top-10 season bests of one gender, one row per athlete (their fastest run; a time
 * tie goes to the earlier run, so the date is stable), ranked by time with the name tie-break —
 * the same order the records boards use.
 */
function bestsOf(fiveKm: YearRunRow[], gender: GenderType): YearBestResult[] {
  const bestByAthlete = new Map<string, YearRunRow>();

  for (const row of fiveKm) {
    if (row.gender !== gender) {
      continue;
    }

    const best = bestByAthlete.get(row.key);

    if (best === undefined || row.timeMs < best.timeMs || (row.timeMs === best.timeMs && row.dateIso < best.dateIso)) {
      bestByAthlete.set(row.key, row);
    }
  }

  return [...bestByAthlete.values()]
    .sort((left, right) => left.timeMs - right.timeMs || left.displayName.localeCompare(right.displayName, NAME_COLLATION_LOCALE))
    .slice(0, YEAR_BESTS_LIMIT)
    .map((row) => ({ key: row.key, displayName: row.displayName, timeMs: row.timeMs, dateIso: row.dateIso, slug: row.slug }));
}

function mostActiveOf(byAthlete: Map<string, YearRunRow[]>): YearActiveAthlete[] {
  return [...byAthlete.values()]
    .map((rows) => ({ key: rows[0].key, displayName: rows[0].displayName, finishCount: rows.length }))
    .sort((left, right) => right.finishCount - left.finishCount || left.displayName.localeCompare(right.displayName, NAME_COLLATION_LOCALE))
    .slice(0, MOST_ACTIVE_LIMIT);
}

function badgeHoldersOf(
  byAthlete: Map<string, YearRunRow[]>,
  firstEventDate: string | null,
  signalsByAthlete: Map<string, AthleteBadgeSignals>,
  year: string,
): YearBadgeHolders[] {
  const holdersByBadge = new Map<YearBadgeType, YearBadgeHolders['holders']>();

  for (const rows of byAthlete.values()) {
    const months = new Set(rows.map((row) => row.dateIso.slice(ISO_MONTH_START, ISO_MONTH_END)));
    const signals = athleteSignalsOf(signalsByAthlete, rows[0].key);
    const badges = yearBadgesOf({
      runCount: rows.length,
      monthCount: months.size,
      ranNewYearRace: firstEventDate !== null && rows.some((row) => row.dateIso === firstEventDate),
      hasComeback: signals.comebackYears.has(year),
      slowFinishCount: signals.slowFinishCountByYear[year] ?? 0,
    });

    for (const badge of badges) {
      const holders = holdersByBadge.get(badge) ?? [];

      holders.push({ key: rows[0].key, displayName: rows[0].displayName });
      holdersByBadge.set(badge, holders);
    }
  }

  return BADGE_DISPLAY_ORDER.flatMap((badge) => {
    const holders = holdersByBadge.get(badge);

    if (holders === undefined) {
      return [];
    }

    return [{ badge, holders: holders.sort((left, right) => left.displayName.localeCompare(right.displayName, NAME_COLLATION_LOCALE)) }];
  });
}

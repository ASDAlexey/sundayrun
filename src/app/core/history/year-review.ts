import { Gender, GenderType } from '../models/gender.enum';
import { NAME_COLLATION_LOCALE } from './athletes-list.constant';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { ISO_MONTH_END, ISO_MONTH_START } from './year-badges.constant';
import { medianMsOrNull } from './median';
import { yearBadgesOf } from './year-badges';
import { YearBadge, YearBadgeType } from './year-badges.enum';
import { MOST_ACTIVE_LIMIT } from './year-review.constant';
import { YearActiveAthlete, YearBadgeHolders, YearBestResult, YearReview, YearReviewSource, YearRunRow } from './year-review.interface';

/** Display order of the badge holder lists on the year review page. */
const BADGE_DISPLAY_ORDER: readonly YearBadgeType[] = [
  YearBadge.obsessiveGold,
  YearBadge.obsessiveSilver,
  YearBadge.obsessiveBronze,
  YearBadge.allMonths,
  YearBadge.newYearRace,
];

/**
 * Boils one year of the archive down to the «Итоги года» page: totals, per-gender medians and
 * bests over the 5 km runs, the most active finishers and every badge holder of the year.
 * All ties break by name in Russian collation, so the lists are stable between loads.
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
    bestMale: bestOf(fiveKm, Gender.male),
    bestFemale: bestOf(fiveKm, Gender.female),
    mostActive: mostActiveOf(byAthlete),
    badgeHolders: badgeHoldersOf(byAthlete, source.eventDates[0] ?? null),
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

/** The year's fastest 5 km of one gender; ties go to the earliest run, so the record date is stable. */
function bestOf(fiveKm: YearRunRow[], gender: GenderType): YearBestResult | null {
  let best: YearRunRow | null = null;

  for (const row of fiveKm) {
    if (row.gender !== gender) {
      continue;
    }

    if (best === null || row.timeMs < best.timeMs || (row.timeMs === best.timeMs && row.dateIso < best.dateIso)) {
      best = row;
    }
  }

  return best === null ? null : { key: best.key, displayName: best.displayName, timeMs: best.timeMs, slug: best.slug };
}

function mostActiveOf(byAthlete: Map<string, YearRunRow[]>): YearActiveAthlete[] {
  return [...byAthlete.values()]
    .map((rows) => ({ key: rows[0].key, displayName: rows[0].displayName, finishCount: rows.length }))
    .sort((left, right) => right.finishCount - left.finishCount || left.displayName.localeCompare(right.displayName, NAME_COLLATION_LOCALE))
    .slice(0, MOST_ACTIVE_LIMIT);
}

function badgeHoldersOf(byAthlete: Map<string, YearRunRow[]>, firstEventDate: string | null): YearBadgeHolders[] {
  const holdersByBadge = new Map<YearBadgeType, YearBadgeHolders['holders']>();

  for (const rows of byAthlete.values()) {
    const months = new Set(rows.map((row) => row.dateIso.slice(ISO_MONTH_START, ISO_MONTH_END)));
    const badges = yearBadgesOf({
      runCount: rows.length,
      monthCount: months.size,
      ranNewYearRace: firstEventDate !== null && rows.some((row) => row.dateIso === firstEventDate),
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

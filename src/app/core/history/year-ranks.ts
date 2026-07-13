import { YearBadge, YearBadgeType } from './year-badges.enum';
import { YEAR_KING_RANK, YEAR_PODIUM_MAX_RANK, YEAR_TOP_TEN_MAX_RANK, YEAR_TOP_THIRTY_MAX_RANK } from './year-ranks.constant';
import { YearBestRow, YearRankedBadge } from './year-ranks.interface';

/** The badge a year rank earns: 1st is the crown, 2–3 the podium, then the top-10 and top-30 cuts. */
export function yearRankBadge(rank: number): YearBadgeType | null {
  if (rank === YEAR_KING_RANK) {
    return YearBadge.yearKing;
  }

  if (rank <= YEAR_PODIUM_MAX_RANK) {
    return YearBadge.yearPodium;
  }

  if (rank <= YEAR_TOP_TEN_MAX_RANK) {
    return YearBadge.yearTopTen;
  }

  if (rank <= YEAR_TOP_THIRTY_MAX_RANK) {
    return YearBadge.yearTopThirty;
  }

  return null;
}

/**
 * Every athlete-year that earned a ranking badge. Men and women race their own tables; the rank is
 * competition-style — one plus the strictly faster athletes of the same year and gender — so a tie
 * shares the rank (two equal best times can both crown a king) instead of breaking arbitrarily.
 */
export function yearRankedBadges(rows: readonly YearBestRow[]): YearRankedBadge[] {
  const rowsByTable = new Map<string, YearBestRow[]>();

  for (const row of rows) {
    const tableRows = rowsByTable.get(tableKey(row));

    if (tableRows === undefined) {
      rowsByTable.set(tableKey(row), [row]);
    } else {
      tableRows.push(row);
    }
  }

  const ranked: YearRankedBadge[] = [];

  for (const tableRows of rowsByTable.values()) {
    const times = tableRows.map((row) => row.bestMs).sort((left, right) => left - right);

    for (const row of tableRows) {
      // The row's own time is in the table, so the first not-faster index counts the strictly faster ones.
      const badge = yearRankBadge(times.findIndex((timeMs) => timeMs >= row.bestMs) + 1);

      if (badge !== null) {
        ranked.push({ athleteKey: row.athleteKey, year: row.year, badge });
      }
    }
  }

  return ranked;
}

/** One athlete's ranking badge per year — merged in front of the activity badges on the athlete page. */
export function athleteYearRankBadges(rows: readonly YearBestRow[], athleteKey: string): Record<string, YearBadgeType> {
  const byYear: Record<string, YearBadgeType> = {};

  for (const ranked of yearRankedBadges(rows)) {
    if (ranked.athleteKey === athleteKey) {
      byYear[ranked.year] = ranked.badge;
    }
  }

  return byYear;
}

/** Badge → every athlete who earned it in any year — the ranking half of the rarity counters. */
export function yearRankBadgeHolders(rows: readonly YearBestRow[]): Map<YearBadgeType, Set<string>> {
  const holdersByBadge = new Map<YearBadgeType, Set<string>>();

  for (const ranked of yearRankedBadges(rows)) {
    const holders = holdersByBadge.get(ranked.badge) ?? new Set<string>();

    holders.add(ranked.athleteKey);
    holdersByBadge.set(ranked.badge, holders);
  }

  return holdersByBadge;
}

function tableKey(row: YearBestRow): string {
  return `${row.year}:${row.gender}`;
}

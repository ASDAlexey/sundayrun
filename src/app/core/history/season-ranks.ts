import { SEASON_KING_BADGES, SEASON_KING_RANK, SEASON_PODIUM_BADGES, SEASON_PODIUM_MAX_RANK } from './season-ranks.constant';
import { SeasonBestRow } from './season-ranks.interface';
import { SeasonType } from './seasons.enum';
import { YearBadgeType } from './year-badges.enum';
import { YearRankedBadge } from './year-ranks.interface';

/** The badge a season rank earns: 1st is the season's crown, 2–3 the podium; deeper cuts earn nothing. */
export function seasonRankBadge(rank: number, season: SeasonType): YearBadgeType | null {
  if (rank === SEASON_KING_RANK) {
    return SEASON_KING_BADGES[season];
  }

  if (rank <= SEASON_PODIUM_MAX_RANK) {
    return SEASON_PODIUM_BADGES[season];
  }

  return null;
}

/**
 * Every athlete-season that earned a ranking badge. Men and women race their own tables per
 * year-season; the rank is competition-style — one plus the strictly faster athletes of the same
 * table — so a tie shares the rank, like the year tables.
 */
export function seasonRankedBadges(rows: readonly SeasonBestRow[]): YearRankedBadge[] {
  const rowsByTable = new Map<string, SeasonBestRow[]>();

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
      const badge = seasonRankBadge(times.findIndex((timeMs) => timeMs >= row.bestMs) + 1, row.season);

      if (badge !== null) {
        ranked.push({ athleteKey: row.athleteKey, year: row.year, badge });
      }
    }
  }

  return ranked;
}

/** One athlete's season ranking badges per year — merged after the year crown on the athlete page. */
export function athleteSeasonRankBadges(rows: readonly SeasonBestRow[], athleteKey: string): Record<string, YearBadgeType[]> {
  const byYear: Record<string, YearBadgeType[]> = {};

  for (const ranked of seasonRankedBadges(rows)) {
    if (ranked.athleteKey === athleteKey) {
      (byYear[ranked.year] ??= []).push(ranked.badge);
    }
  }

  return byYear;
}

/** Badge → every athlete who earned it in any season — the season half of the rarity counters. */
export function seasonRankBadgeHolders(rows: readonly SeasonBestRow[]): Map<YearBadgeType, Set<string>> {
  const holdersByBadge = new Map<YearBadgeType, Set<string>>();

  for (const ranked of seasonRankedBadges(rows)) {
    const holders = holdersByBadge.get(ranked.badge) ?? new Set<string>();

    holders.add(ranked.athleteKey);
    holdersByBadge.set(ranked.badge, holders);
  }

  return holdersByBadge;
}

function tableKey(row: SeasonBestRow): string {
  return `${row.year}:${row.season}:${row.gender}`;
}

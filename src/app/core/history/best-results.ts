import { AthleteRecord, AthleteRun } from '../models/athlete-history.interface';
import { GenderType } from '../models/gender.enum';
import { NAME_COLLATION_LOCALE } from './athletes-list.constant';
import { BestResult } from './best-results.interface';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { isoYear } from './iso-year';
import { seasonOfIso } from './seasons';
import { SeasonType } from './seasons.enum';

/**
 * The full 5 km leaderboard for one gender: fastest bests first (ties break by name in Russian
 * collation). `year` narrows it to bests set in that year (`bestMsByYear`); `null` ranks
 * all-time bests. Athletes without a matching finished 5 km run are skipped; each row carries
 * the earliest run where the best was set, so the record date is stable.
 */
export function bestResults(records: AthleteRecord[], gender: GenderType, year: string | null): BestResult[] {
  return records
    .reduce<BestResult[]>((results, record) => {
      const bestMs = year === null ? record.bestMs : (record.bestMsByYear[year] ?? null);

      if (record.gender === gender && bestMs !== null) {
        results.push(toBestResult(record, bestMs, year));
      }

      return results;
    }, [])
    .sort((left, right) => left.bestMs - right.bestMs || left.displayName.localeCompare(right.displayName, NAME_COLLATION_LOCALE));
}

/** Years that have at least one 5 km best, newest first — the options of the year filter. */
export function bestResultYears(records: AthleteRecord[]): string[] {
  const years = new Set(records.flatMap((record) => Object.keys(record.bestMsByYear)));

  return [...years].sort((left, right) => right.localeCompare(left));
}

/**
 * The 5 km leaderboard of one gender narrowed to one calendar-year season: each athlete's best
 * run inside the season, fastest first with the same tie-breaks; the earliest run carrying the
 * best keeps the record date stable, like in `bestResults`.
 */
export function bestSeasonResults(records: AthleteRecord[], gender: GenderType, year: string, season: SeasonType): BestResult[] {
  return records
    .reduce<BestResult[]>((results, record) => {
      if (record.gender !== gender) {
        return results;
      }

      const seasonRuns = record.runs.filter(
        (run) => run.distanceKm === FIVE_KM_DISTANCE_KM && isoYear(run.dateIso) === year && seasonOfIso(run.dateIso) === season,
      );
      const best = seasonRuns.reduce<AthleteRun | null>(
        (fastest, run) =>
          fastest === null || run.timeMs < fastest.timeMs || (run.timeMs === fastest.timeMs && run.dateIso < fastest.dateIso)
            ? run
            : fastest,
        null,
      );

      if (best !== null) {
        results.push({ key: record.key, displayName: record.displayName, bestMs: best.timeMs, dateIso: best.dateIso, slug: best.slug });
      }

      return results;
    }, [])
    .sort((left, right) => left.bestMs - right.bestMs || left.displayName.localeCompare(right.displayName, NAME_COLLATION_LOCALE));
}

function toBestResult(record: AthleteRecord, bestMs: number, year: string | null): BestResult {
  const bestRun = record.runs
    .filter((run) => run.distanceKm === FIVE_KM_DISTANCE_KM && run.timeMs === bestMs && (year === null || isoYear(run.dateIso) === year))
    .reduce((earliest, run) => (run.dateIso < earliest.dateIso ? run : earliest));

  return {
    key: record.key,
    displayName: record.displayName,
    bestMs,
    dateIso: bestRun.dateIso,
    slug: bestRun.slug,
  };
}

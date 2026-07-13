import { Injectable, inject } from '@angular/core';

import { YearBadgeRarity } from '../core/history/badge-rarity.type';
import { CourseRecordHistory } from '../core/history/course-records.type';
import { AthleteFirstLap } from '../core/history/first-lap.interface';
import { FirstLapRecords } from '../core/history/first-lap.type';
import { LegendFinish } from '../core/history/legend.interface';
import { OverallStats } from '../core/history/overall-stats.interface';
import { RivalRun } from '../core/history/rivals.interface';
import { EventWinnerTimes } from '../core/history/runner-scores.interface';
import { SeasonRun } from '../core/history/season-positions.interface';
import { EventWeatherRow } from '../core/history/weather-records.interface';
import { YearBestRow } from '../core/history/year-ranks.interface';
import { AthleteRecord } from '../core/models/athlete-history.interface';
import { createProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import { selectYearBadgeRarity, selectYearBestRows } from './protocol-db-badges';
import {
  selectAthleteBestFirstLap,
  selectAthleteRecord,
  selectAthleteRecords,
  selectAthleteRunPlaces,
  selectCourseRecords,
  selectEventSlugs,
  selectEventWinnerTimes,
  selectFirstEventDateByYear,
  selectFirstLapRecords,
  selectLegendFinishes,
  selectOverallStats,
  selectRivalRuns,
} from './protocol-db-queries';
import { selectSeasonLapRuns, selectSeasonRuns } from './protocol-db-season';
import { selectEventWeatherRows } from './protocol-db-weather';
import { PROTOCOL_DB } from './protocol-db.token';

/**
 * Anonymous read of the public athletes history from `sundayrun.db` over HTTP range requests — the
 * visitor-facing counterpart of the admin-only `HistoryService` (which needs a fresh copy via the
 * authorized Contents API). `loadRecord`/`loadRecords`/`loadOverallStats` run keyed selects or SQL
 * aggregates; the db service retries a transient range failure, and a persistent one rejects so the
 * page shows its error state with a reload. There is no JSON mirror to fall back to.
 */
@Injectable({ providedIn: 'root' })
export class AthletesService {
  readonly #db = createProtocolDrizzle(inject(PROTOCOL_DB));

  /** One athlete for the athlete page: a few keyed selects. */
  loadRecord(key: string): Promise<AthleteRecord | null> {
    return selectAthleteRecord(this.#db, key);
  }

  /** Slug → the athlete's gender place there; feeds the «Место» column of the runs table. */
  loadRunPlaces(key: string): Promise<Record<string, number>> {
    return selectAthleteRunPlaces(this.#db, key);
  }

  /** Every ranked athlete for the records page, already shaped for `bestResults`. */
  loadRecords(): Promise<AthleteRecord[]> {
    return selectAthleteRecords(this.#db);
  }

  /** The course record progression for the records page: every record-beating 5 km run per gender. */
  loadCourseRecords(): Promise<CourseRecordHistory> {
    return selectCourseRecords(this.#db);
  }

  /** Every 5 km finish of one season; feeds the standings bump chart on the records page. */
  loadSeasonRuns(year: string): Promise<SeasonRun[]> {
    return selectSeasonRuns(this.#db, year);
  }

  /** The recorded first-lap splits of one season; the chart's «Первый круг» mode ranks these. */
  loadSeasonLapRuns(year: string): Promise<SeasonRun[]> {
    return selectSeasonLapRuns(this.#db, year);
  }

  /** The first-lap (2.3 km) record per gender for the records page. */
  loadFirstLapRecords(): Promise<FirstLapRecords> {
    return selectFirstLapRecords(this.#db);
  }

  /** The athlete's fastest recorded first lap; null while none of their runs carries a split. */
  loadBestFirstLap(key: string): Promise<AthleteFirstLap | null> {
    return selectAthleteBestFirstLap(this.#db, key);
  }

  /** The home page totals as SQL aggregates. */
  loadOverallStats(): Promise<OverallStats> {
    return selectOverallStats(this.#db);
  }

  /** Year → the date of that year's first race; feeds the new-year badge on the athlete page. */
  loadFirstEventDateByYear(): Promise<Record<string, string>> {
    return selectFirstEventDateByYear(this.#db);
  }

  /** Every event slug oldest first; feeds the streak counters on the athlete page. */
  loadEventSlugs(): Promise<string[]> {
    return selectEventSlugs(this.#db);
  }

  /** Every event's per-gender winning 5 km times; the runner-score denominators of the ratings. */
  loadEventWinnerTimes(): Promise<EventWinnerTimes[]> {
    return selectEventWinnerTimes(this.#db);
  }

  /** Badge → the share of participants who ever earned it; the rarity hint on the badge chips. */
  loadYearBadgeRarity(): Promise<YearBadgeRarity> {
    return selectYearBadgeRarity(this.#db);
  }

  /** Every athlete-year's best 5 km time; feeds the year-ranking badges on the athlete page. */
  loadYearBests(): Promise<YearBestRow[]> {
    return selectYearBestRows(this.#db);
  }

  /** Every finished run of the archive; feeds the «Легенда трассы» window tally on the athlete page. */
  loadLegendFinishes(): Promise<LegendFinish[]> {
    return selectLegendFinishes(this.#db);
  }

  /** Every 5 km finish at the athlete's events (own rows included); feeds the «Соперники» card. */
  loadRivalRuns(key: string): Promise<RivalRun[]> {
    return selectRivalRuns(this.#db, key);
  }

  /** Every event's stored 9:00 weather; feeds the weather extremes and the athlete's weather bests. */
  loadWeatherRows(): Promise<EventWeatherRow[]> {
    return selectEventWeatherRows(this.#db);
  }
}

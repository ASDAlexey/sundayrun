import { Injectable, inject } from '@angular/core';

import { YearBadgeRarity } from '../core/history/badge-rarity.type';
import { CourseRecordHistory } from '../core/history/course-records.type';
import { LegendFinish } from '../core/history/legend.interface';
import { OverallStats } from '../core/history/overall-stats.interface';
import { AthleteRecord } from '../core/models/athlete-history.interface';
import { createProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import {
  selectAthleteRecord,
  selectAthleteRecords,
  selectAthleteRunPlaces,
  selectCourseRecords,
  selectEventSlugs,
  selectFirstEventDateByYear,
  selectLegendFinishes,
  selectOverallStats,
  selectYearBadgeRarity,
} from './protocol-db-queries';
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

  /** Badge → the share of participants who ever earned it; the rarity hint on the badge chips. */
  loadYearBadgeRarity(): Promise<YearBadgeRarity> {
    return selectYearBadgeRarity(this.#db);
  }

  /** Every finished run of the archive; feeds the «Легенда трассы» window tally on the athlete page. */
  loadLegendFinishes(): Promise<LegendFinish[]> {
    return selectLegendFinishes(this.#db);
  }
}

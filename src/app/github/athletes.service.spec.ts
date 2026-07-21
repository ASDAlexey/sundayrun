import { TestBed } from '@angular/core/testing';

import { ProtocolDb } from '../core/sqlite/protocol-db.interface';
import { createMemoryProtocolDb } from '../core/sqlite/spec-utils/protocol-db-memory';
import { AthletesService } from './athletes.service';
import { EXPECTED_DB_BADGE_RARITY, EXPECTED_DB_SEASON_BEST_ROWS, EXPECTED_DB_YEAR_BEST_ROWS } from './protocol-db-badges.mock';
import {
  ATHLETE_KEY,
  EXPECTED_ATHLETE_RECORD,
  EXPECTED_COURSE_RECORDS,
  EXPECTED_DB_BEST_FIRST_LAP,
  EXPECTED_DB_FIRST_LAPS,
  EXPECTED_DB_FIRST_LAP_RECORDS,
  EXPECTED_DB_WEATHER_ROWS,
  EXPECTED_EVENT_SLUGS,
  EXPECTED_FIRST_EVENT_DATE_BY_YEAR,
  EXPECTED_LEADERBOARD_RECORDS,
  EXPECTED_LEGEND_FINISHES,
  EXPECTED_LONE_RIVAL_RUNS,
  EXPECTED_RUN_PLACES,
  EXPECTED_SEASON_RUNS,
  EXPECTED_SQL_STATS,
  EXPECTED_SEASON_LAP_RUNS,
  EXPECTED_WINNER_TIMES,
  POPULATED_SEED,
  SEASON_RUNS_YEAR,
  UNKNOWN_ATHLETE_KEY,
} from './protocol-db-queries.mock';
import { PROTOCOL_DB_ERROR_MESSAGE } from './protocol-db.service.mock';
import { PROTOCOL_DB } from './protocol-db.token';

describe('AthletesService', () => {
  let close: (() => void) | null = null;

  afterEach(() => {
    close?.();
    close = null;
  });

  async function serviceOver(db: ProtocolDb): Promise<AthletesService> {
    TestBed.configureTestingModule({ providers: [{ provide: PROTOCOL_DB, useValue: db }] });

    return TestBed.inject(AthletesService);
  }

  it('serves the athlete record, the leaderboards and the overall stats from sundayrun.db', async () => {
    const memory = await createMemoryProtocolDb(POPULATED_SEED);

    close = memory.close;

    const service = await serviceOver(memory.db);

    await expect(service.loadRecord(ATHLETE_KEY)).resolves.toEqual(EXPECTED_ATHLETE_RECORD);
    await expect(service.loadRecord(UNKNOWN_ATHLETE_KEY), 'an unknown key resolves to null').resolves.toBeNull();
    await expect(service.loadRunPlaces(ATHLETE_KEY)).resolves.toEqual(EXPECTED_RUN_PLACES);
    await expect(service.loadRecords()).resolves.toEqual(EXPECTED_LEADERBOARD_RECORDS);
    await expect(service.loadCourseRecords()).resolves.toEqual(EXPECTED_COURSE_RECORDS);
    await expect(service.loadOverallStats()).resolves.toEqual(EXPECTED_SQL_STATS);
    await expect(service.loadEventSlugs()).resolves.toEqual(EXPECTED_EVENT_SLUGS);
    await expect(service.loadEventWinnerTimes()).resolves.toEqual(EXPECTED_WINNER_TIMES);
    await expect(service.loadWeatherRows()).resolves.toEqual(EXPECTED_DB_WEATHER_ROWS);
    await expect(service.loadFirstEventDateByYear()).resolves.toEqual(EXPECTED_FIRST_EVENT_DATE_BY_YEAR);
    await expect(service.loadYearBadgeRarity(), 'the ranking crowns reach the rarity map').resolves.toEqual(EXPECTED_DB_BADGE_RARITY);
    await expect(service.loadYearBests()).resolves.toEqual(EXPECTED_DB_YEAR_BEST_ROWS);
    await expect(service.loadSeasonBests()).resolves.toEqual(EXPECTED_DB_SEASON_BEST_ROWS);
    await expect(service.loadLegendFinishes()).resolves.toEqual(EXPECTED_LEGEND_FINISHES);
    await expect(service.loadRivalRuns(ATHLETE_KEY)).resolves.toEqual(EXPECTED_LONE_RIVAL_RUNS);
    await expect(service.loadFirstLapRecords()).resolves.toEqual(EXPECTED_DB_FIRST_LAP_RECORDS);
    await expect(service.loadBestFirstLap(ATHLETE_KEY)).resolves.toEqual(EXPECTED_DB_BEST_FIRST_LAP);
    await expect(service.loadFirstLaps(ATHLETE_KEY)).resolves.toEqual(EXPECTED_DB_FIRST_LAPS);
    await expect(service.loadSeasonRuns(SEASON_RUNS_YEAR)).resolves.toEqual(EXPECTED_SEASON_RUNS);
    await expect(service.loadSeasonLapRuns(SEASON_RUNS_YEAR)).resolves.toEqual(EXPECTED_SEASON_LAP_RUNS);
  });

  it('propagates a db failure from every read so the page can show a distinct error state', async () => {
    const service = await serviceOver({ queryValues: () => Promise.reject(new Error(PROTOCOL_DB_ERROR_MESSAGE)) });

    await expect(service.loadRecord(ATHLETE_KEY)).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
    await expect(service.loadRunPlaces(ATHLETE_KEY)).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
    await expect(service.loadRecords()).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
    await expect(service.loadCourseRecords()).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
    await expect(service.loadOverallStats()).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
    await expect(service.loadEventSlugs()).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
    await expect(service.loadLegendFinishes()).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
    await expect(service.loadRivalRuns(ATHLETE_KEY)).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
    await expect(service.loadFirstLapRecords()).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
    await expect(service.loadBestFirstLap(ATHLETE_KEY)).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
    await expect(service.loadSeasonRuns(SEASON_RUNS_YEAR)).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
  });
});

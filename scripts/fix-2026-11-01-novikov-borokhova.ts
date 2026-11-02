/**
 * One-off fix reported by the timekeeper after 2026-11-01: Новиков Сергей was tapped by mistake at
 * 20:22,96 and really finished right after Ширшов Денис at 21:36 (hundredths were not recorded), and
 * «Борхова Марина» is «Борохова Марина» in every protocol she appears in.
 *
 * All affected events are re-published in one batch through the production write path, so notes,
 * the rollup tables, summary counts and `meta.overallStats` are recomputed. Places are not derived
 * by the write path, so the 2026-11-01 rows are re-sorted and re-placed here.
 *
 * Run: bun scripts/fix-2026-11-01-novikov-borokhova.ts
 */
import { Database } from 'bun:sqlite';
import { copyFile, readFile, writeFile } from 'node:fs/promises';

import { ProtocolRow } from '../src/app/core/models/protocol-row.interface';
import { RaceEvent } from '../src/app/core/models/race-event.interface';
import { EventWeather } from '../src/app/core/weather/event-weather.interface';
import { asGender } from '../src/app/core/sqlite/protocol-db-read';
import { ProtocolDbEventUpdate } from '../src/app/core/sqlite/protocol-db-write.interface';
import { applyEventsToDb } from '../src/app/core/sqlite/protocol-db-write';

const DB_PATH = 'data/sundayrun.db';
const BACKUP_PATH = 'data/sundayrun.db.before-2026-11-01-fix';
const TIME_FIX_SLUG = '2026-11-01';
const TIME_FIX_NAME = 'Новиков Сергей';
const TIME_FIX_WRONG_MS = 1222957;
const TIME_FIX_RIGHT_MS = 1296000;
const TIME_FIX_RIGHT_TEXT = '21:36,00';
const WRONG_NAME = 'Борхова Марина';
const RIGHT_NAME = 'Борохова Марина';

interface EventRow {
  number: number;
  legacy_number: string | null;
  city: string;
  park: string;
  club_name: string;
  chairman: string;
}

interface ResultRow {
  idx: number;
  full_name: string;
  time23: string;
  time5: string;
  total_ms: number | null;
  distance_km: number | null;
  gender: string | null;
  place_m: number | null;
  place_f: number | null;
  club: string;
  note: string;
}

interface WeatherRow {
  temperature_c: number | null;
  apparent_c: number | null;
  precipitation_mm: number | null;
  wind_kmh: number | null;
  weather_code: number | null;
  recent_precipitation_mm: number | null;
}

const source = new Database(DB_PATH, { readonly: true });

const readRows = (slug: string): ProtocolRow[] =>
  source
    .query<ResultRow, [string]>(
      'SELECT idx, full_name, time23, time5, total_ms, distance_km, gender, place_m, place_f, club, note FROM results WHERE slug = ?1 ORDER BY idx',
    )
    .all(slug)
    .map((row) => ({
      index: row.idx,
      fullName: row.full_name === WRONG_NAME ? RIGHT_NAME : row.full_name,
      time23: row.time23,
      time5: row.time5,
      totalMs: row.total_ms,
      distanceKm: row.distance_km,
      gender: asGender(row.gender),
      placeM: row.place_m,
      placeF: row.place_f,
      club: row.club,
      note: row.note,
    }));

const fixNovikov = (rows: ProtocolRow[]): ProtocolRow[] => {
  const target = rows.find((row) => row.fullName === TIME_FIX_NAME);

  if (target?.totalMs !== TIME_FIX_WRONG_MS) {
    throw new Error(`${TIME_FIX_NAME} on ${TIME_FIX_SLUG} is not at the wrong time — the fix has already been applied`);
  }

  const patched = rows.map((row) => (row === target ? { ...row, time5: TIME_FIX_RIGHT_TEXT, totalMs: TIME_FIX_RIGHT_MS } : row));
  const finishers = patched.filter((row) => row.totalMs !== null).sort((a, b) => (a.totalMs ?? 0) - (b.totalMs ?? 0));
  const rest = patched.filter((row) => row.totalMs === null);
  let male = 0;
  let female = 0;

  return [...finishers, ...rest].map((row, position) => {
    const placed = row.totalMs !== null;

    return {
      ...row,
      index: position + 1,
      placeM: placed && row.gender === 'M' ? ++male : row.placeM,
      placeF: placed && row.gender === 'F' ? ++female : row.placeF,
    };
  });
};

const slugs = [
  ...new Set([
    TIME_FIX_SLUG,
    ...source
      .query<{ slug: string }, [string]>('SELECT DISTINCT slug FROM results WHERE full_name = ?1')
      .all(WRONG_NAME)
      .map((row) => row.slug),
  ]),
].sort();

const updates: ProtocolDbEventUpdate[] = slugs.map((slug) => {
  const eventRow = source
    .query<EventRow, [string]>('SELECT number, legacy_number, city, park, club_name, chairman FROM events WHERE slug = ?1')
    .get(slug);

  if (eventRow === null) {
    throw new Error(`Event ${slug} not found`);
  }

  const weatherRow = source
    .query<WeatherRow, [string]>(
      'SELECT temperature_c, apparent_c, precipitation_mm, wind_kmh, weather_code, recent_precipitation_mm FROM event_weather WHERE slug = ?1',
    )
    .get(slug);

  const event: RaceEvent = {
    number: eventRow.number,
    legacyNumber: eventRow.legacy_number,
    dateIso: slug,
    city: eventRow.city,
    park: eventRow.park,
    clubName: eventRow.club_name,
    chairman: eventRow.chairman,
  };

  const weather: EventWeather | null =
    weatherRow === null
      ? null
      : {
          temperatureC: weatherRow.temperature_c,
          apparentC: weatherRow.apparent_c,
          precipitationMm: weatherRow.precipitation_mm,
          windKmh: weatherRow.wind_kmh,
          weatherCode: weatherRow.weather_code,
          recentPrecipitationMm: weatherRow.recent_precipitation_mm,
        };

  const rows = readRows(slug);

  return { event, rows: slug === TIME_FIX_SLUG ? fixNovikov(rows) : rows, weather };
});

source.close();

console.log(`Re-publishing ${slugs.length} events: ${slugs.join(', ')}`);

await copyFile(DB_PATH, BACKUP_PATH);

const originalBytes = new Uint8Array(await readFile(DB_PATH));

await writeFile(DB_PATH, await applyEventsToDb(originalBytes, updates));

console.log(`Backup: ${BACKUP_PATH}`);

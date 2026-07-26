/**
 * One-off fix: the 2026-05-17 protocol spelled Кабенов Арман as «Кабанов Арман», so the publish
 * opened a second athlete for the same man — hence «Первое участие» on a fourth start and «1» in
 * the all-time participation column.
 *
 * The rename goes through the production write path rather than an UPDATE: the event is removed and
 * re-published with the corrected surname, so notes, the athletes/runs/participations rollup, the
 * event summary counts and `meta.overallStats` are all recomputed the way a real publication does.
 * The publish-time weather is read out first and handed back, because the removal drops it.
 *
 * Run: bun scripts/fix-kabenov-name-2026-05-17.ts
 */
import { Database } from 'bun:sqlite';
import { copyFile, readFile, writeFile } from 'node:fs/promises';

import { ProtocolRow } from '../src/app/core/models/protocol-row.interface';
import { RaceEvent } from '../src/app/core/models/race-event.interface';
import { EventWeather } from '../src/app/core/weather/event-weather.interface';
import { asGender } from '../src/app/core/sqlite/protocol-db-read';
import { applyEventToDb, removeEventFromDb } from '../src/app/core/sqlite/protocol-db-write';

const DB_PATH = 'data/sundayrun.db';
const BACKUP_PATH = 'data/sundayrun.db.before-kabenov-fix';
const SLUG = '2026-05-17';
const WRONG_NAME = 'Кабанов Арман';
const RIGHT_NAME = 'Кабенов Арман';

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
}

const source = new Database(DB_PATH, { readonly: true });
const eventRow = source
  .query<EventRow, [string]>('SELECT number, legacy_number, city, park, club_name, chairman FROM events WHERE slug = ?1')
  .get(SLUG);

if (eventRow === null) {
  throw new Error(`Event ${SLUG} not found`);
}

const resultRows = source
  .query<ResultRow, [string]>(
    'SELECT idx, full_name, time23, time5, total_ms, distance_km, gender, place_m, place_f, club, note FROM results WHERE slug = ?1 ORDER BY idx',
  )
  .all(SLUG);

if (!resultRows.some((row) => row.full_name === WRONG_NAME)) {
  throw new Error(`«${WRONG_NAME}» is not in ${SLUG} — the fix has already been applied`);
}

const weatherRow = source
  .query<WeatherRow, [string]>(
    'SELECT temperature_c, apparent_c, precipitation_mm, wind_kmh, weather_code FROM event_weather WHERE slug = ?1',
  )
  .get(SLUG);

source.close();

const event: RaceEvent = {
  number: eventRow.number,
  legacyNumber: eventRow.legacy_number,
  dateIso: SLUG,
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
      };

const rows: ProtocolRow[] = resultRows.map((row) => ({
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

await copyFile(DB_PATH, BACKUP_PATH);

const originalBytes = new Uint8Array(await readFile(DB_PATH));
const afterRemoval = await removeEventFromDb(originalBytes, { slug: SLUG });
const afterReAdd = await applyEventToDb(afterRemoval, { event, rows, weather });

await writeFile(DB_PATH, afterReAdd);

const fixed = new Database(DB_PATH, { readonly: true });

console.log(`Backup: ${BACKUP_PATH}`);
console.log('\nresults:');

for (const row of fixed
  .query<{ slug: string; note: string }, [string]>('SELECT slug, note FROM results WHERE full_name = ?1 ORDER BY slug')
  .all(RIGHT_NAME)) {
  console.log(`  ${row.slug}  note: '${row.note}'`);
}

console.log('\nathletes:');

for (const row of fixed
  .query<{ key: string; display_name: string; best_ms: number | null }, []>(
    "SELECT key, display_name, best_ms FROM athletes WHERE key LIKE '%каб%'",
  )
  .all()) {
  console.log(`  ${row.key} | ${row.display_name} | ${row.best_ms}`);
}

console.log('\nruns:');

for (const row of fixed
  .query<{ date_iso: string; time_ms: number }, [string]>('SELECT date_iso, time_ms FROM runs WHERE athlete_key = ?1 ORDER BY date_iso')
  .all('кабенов арман')) {
  console.log(`  ${row.date_iso}  ${row.time_ms}`);
}

const summary = fixed
  .query<{ newcomer_count: number | null; personal_record_count: number | null }, [string]>(
    'SELECT newcomer_count, personal_record_count FROM events WHERE slug = ?1',
  )
  .get(SLUG);
const stats = fixed.query<{ value: string }, [string]>('SELECT value FROM meta WHERE key = ?1').get('overallStats');
const weatherBack = fixed
  .query<WeatherRow, [string]>(
    'SELECT temperature_c, apparent_c, precipitation_mm, wind_kmh, weather_code FROM event_weather WHERE slug = ?1',
  )
  .get(SLUG);

console.log(`\n${SLUG}: newcomers ${summary?.newcomer_count}, records ${summary?.personal_record_count}`);
console.log(`weather: ${JSON.stringify(weatherBack)}`);
console.log(`overallStats: ${stats?.value}`);

fixed.close();

/**
 * One-off fix: five protocols spelled Хандыго Наталья as «Хандыга Наталья», so the archive carried
 * two athletes for the same woman — a second «Первое участие» on 2025-11-09 and two parallel personal
 * record chains.
 *
 * The rename goes through the production write path rather than an UPDATE: the affected events are
 * re-published with the corrected surname in one batch, so `applyEventsToDb` drops their old rollup
 * contribution, rebuilds the athletes/runs/participations tables, and recomputes notes, the event
 * summary counts and `meta.overallStats` the way a real publication does. The stored weather is read
 * out first and handed back, because the rewrite replaces the published slugs' weather rows.
 *
 * Run: bun scripts/fix-handygo-name.ts
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
const BACKUP_PATH = 'data/sundayrun.db.before-handygo-fix';
const WRONG_NAME = 'Хандыга Наталья';
const RIGHT_NAME = 'Хандыго Наталья';
const RIGHT_KEY = 'хандыго наталья';

interface EventRow {
  slug: string;
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
const slugs = source
  .query<{ slug: string }, [string]>('SELECT DISTINCT slug FROM results WHERE full_name = ?1 ORDER BY slug')
  .all(WRONG_NAME)
  .map((row) => row.slug);

if (slugs.length === 0) {
  throw new Error(`«${WRONG_NAME}» is not in the archive — the fix has already been applied`);
}

const updates: ProtocolDbEventUpdate[] = slugs.map((slug) => {
  const eventRow = source
    .query<EventRow, [string]>('SELECT slug, number, legacy_number, city, park, club_name, chairman FROM events WHERE slug = ?1')
    .get(slug);

  if (eventRow === null) {
    throw new Error(`Event ${slug} not found`);
  }

  const resultRows = source
    .query<ResultRow, [string]>(
      'SELECT idx, full_name, time23, time5, total_ms, distance_km, gender, place_m, place_f, club, note FROM results WHERE slug = ?1 ORDER BY idx',
    )
    .all(slug);

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

  return { event, rows, weather };
});

source.close();

console.log(`Re-publishing ${slugs.length} events: ${slugs.join(', ')}`);

await copyFile(DB_PATH, BACKUP_PATH);

const originalBytes = new Uint8Array(await readFile(DB_PATH));

await writeFile(DB_PATH, await applyEventsToDb(originalBytes, updates));

const fixed = new Database(DB_PATH, { readonly: true });

console.log(`Backup: ${BACKUP_PATH}`);
console.log('\nathletes:');

for (const row of fixed
  .query<{ key: string; display_name: string; gender: string | null; best_ms: number | null }, []>(
    "SELECT key, display_name, gender, best_ms FROM athletes WHERE key LIKE '%ханды%'",
  )
  .all()) {
  console.log(`  ${row.key} | ${row.display_name} | ${row.gender} | best ${row.best_ms}`);
}

console.log('\nresults:');

for (const row of fixed
  .query<{ slug: string; full_name: string; time5: string; note: string }, [string]>(
    'SELECT slug, full_name, time5, note FROM results WHERE full_name = ?1 ORDER BY slug',
  )
  .all(RIGHT_NAME)) {
  console.log(`  ${row.slug}  ${row.time5}  note: '${row.note}'`);
}

console.log('\nruns:');

for (const row of fixed
  .query<{ date_iso: string; time_ms: number }, [string]>('SELECT date_iso, time_ms FROM runs WHERE athlete_key = ?1 ORDER BY date_iso')
  .all(RIGHT_KEY)) {
  console.log(`  ${row.date_iso}  ${row.time_ms}`);
}

console.log('\nsummaries:');

for (const row of fixed
  .query<{ slug: string; newcomer_count: number | null; personal_record_count: number | null }, string[]>(
    `SELECT slug, newcomer_count, personal_record_count FROM events WHERE slug IN (${slugs.map(() => '?').join(', ')})`,
  )
  .all(...slugs)) {
  console.log(`  ${row.slug}: newcomers ${row.newcomer_count}, records ${row.personal_record_count}`);
}

const stats = fixed.query<{ value: string }, [string]>('SELECT value FROM meta WHERE key = ?1').get('overallStats');

console.log(`\noverallStats: ${stats?.value}`);

fixed.close();

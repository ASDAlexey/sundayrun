/**
 * v4 → v5 migration + backfill: creates the `event_weather` table in the local `data/sundayrun.db`
 * and fills it with each event's 9:00 course weather from the free Open-Meteo archive — the same
 * readings `publishEvent` now fetches for every new publication. Idempotent: events that already
 * store weather are skipped, so a re-run only fetches the gaps.
 * Run: bun scripts/backfill-weather.ts
 */
import { Database } from 'bun:sqlite';

import {
  PROTOCOL_DB_META_SCHEMA_VERSION_KEY,
  PROTOCOL_DB_SCHEMA_VERSION,
  PROTOCOL_DB_V5_MIGRATION_STATEMENTS,
} from '../src/app/core/sqlite/protocol-db-schema.constant';
import { isoToday } from '../src/app/core/time/iso-today';
import { fetchEventWeather } from '../src/app/core/weather/fetch-event-weather';

const db = new Database('data/sundayrun.db');

for (const statement of PROTOCOL_DB_V5_MIGRATION_STATEMENTS) {
  db.exec(statement);
}

const pending = db
  .query<{ slug: string; date_iso: string }, []>(
    'SELECT e.slug, e.date_iso FROM events e LEFT JOIN event_weather w ON w.slug = e.slug WHERE w.slug IS NULL ORDER BY e.date_iso',
  )
  .all();

const upsert = db.query(
  'INSERT INTO event_weather VALUES (?1, ?2, ?3, ?4, ?5, ?6) ' +
    'ON CONFLICT(slug) DO UPDATE SET temperature_c = ?2, apparent_c = ?3, precipitation_mm = ?4, wind_kmh = ?5, weather_code = ?6',
);

const today = isoToday();
let fetched = 0;

for (const { slug, date_iso: dateIso } of pending) {
  const weather = await fetchEventWeather(dateIso, today);

  if (weather === null) {
    console.log(`${slug}: погода недоступна, пропуск`);
    continue;
  }

  upsert.run(slug, weather.temperatureC, weather.apparentC, weather.precipitationMm, weather.windKmh, weather.weatherCode);
  fetched += 1;
  console.log(`${slug}: ${weather.temperatureC}°C, ветер ${weather.windKmh} км/ч, код ${weather.weatherCode}`);
}

db.query('INSERT INTO meta VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2').run(
  PROTOCOL_DB_META_SCHEMA_VERSION_KEY,
  PROTOCOL_DB_SCHEMA_VERSION,
);
db.exec('VACUUM');
db.close();
console.log(`Backfilled ${fetched} of ${pending.length} events.`);

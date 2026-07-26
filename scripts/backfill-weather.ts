/**
 * Weather migration + backfill for the local `data/sundayrun.db`: creates `event_weather` (v4 → v5)
 * and adds the wet-course window's rain (v5 → v6), then fills every event whose row is missing or
 * predates that column with the free Open-Meteo readings — the same ones `publishEvent` fetches for
 * a new publication. Idempotent: a re-run only fetches the gaps.
 *
 * The archive is a decade of Sundays, so the dates are fetched a year at a time: one range request
 * per year per endpoint instead of one per event, which is what Open-Meteo answers with 429 to.
 * Run: bun scripts/backfill-weather.ts
 */
import { Database } from 'bun:sqlite';

import { ISO_DATE_LENGTH } from '../src/app/core/history/notables.constant';
import {
  PROTOCOL_DB_EVENT_WEATHER_COLUMNS_SQL,
  PROTOCOL_DB_META_SCHEMA_VERSION_KEY,
  PROTOCOL_DB_RECENT_PRECIPITATION_COLUMN,
  PROTOCOL_DB_SCHEMA_VERSION,
  PROTOCOL_DB_V5_MIGRATION_STATEMENTS,
  PROTOCOL_DB_V6_MIGRATION_STATEMENTS,
} from '../src/app/core/sqlite/protocol-db-schema.constant';
import { isoToday } from '../src/app/core/time/iso-today';
import { fetchEventsWeather } from '../src/app/core/weather/fetch-event-weather';
import { WET_COURSE_PRECIPITATION_MM } from '../src/app/core/weather/weather-api.constant';

/** 'YYYY' of an ISO date — the fetch batches one year at a time. */
const yearOf = (dateIso: string): string => dateIso.slice(0, ISO_DATE_LENGTH - 6);

const db = new Database('data/sundayrun.db');

for (const statement of PROTOCOL_DB_V5_MIGRATION_STATEMENTS) {
  db.exec(statement);
}

const columns = db.query<{ name: string }, []>(PROTOCOL_DB_EVENT_WEATHER_COLUMNS_SQL).all();

// `ALTER TABLE` has no IF NOT EXISTS, so the v6 statements run only on a db that predates the column.
if (!columns.some(({ name }) => name === PROTOCOL_DB_RECENT_PRECIPITATION_COLUMN)) {
  for (const statement of PROTOCOL_DB_V6_MIGRATION_STATEMENTS) {
    db.exec(statement);
  }
}

const pending = db
  .query<{ slug: string; date_iso: string }, []>(
    'SELECT e.slug, e.date_iso FROM events e LEFT JOIN event_weather w ON w.slug = e.slug ' +
      `WHERE w.slug IS NULL OR w.${PROTOCOL_DB_RECENT_PRECIPITATION_COLUMN} IS NULL ORDER BY e.date_iso`,
  )
  .all();

const upsert = db.query(
  'INSERT INTO event_weather VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) ' +
    'ON CONFLICT(slug) DO UPDATE SET temperature_c = ?2, apparent_c = ?3, precipitation_mm = ?4, wind_kmh = ?5, ' +
    `weather_code = ?6, ${PROTOCOL_DB_RECENT_PRECIPITATION_COLUMN} = ?7`,
);

const byYear = new Map<string, { slug: string; dateIso: string }[]>();

for (const { slug, date_iso: dateIso } of pending) {
  const year = yearOf(dateIso);

  byYear.set(year, [...(byYear.get(year) ?? []), { slug, dateIso }]);
}

const today = isoToday();
let fetched = 0;
let wet = 0;

for (const [year, events] of [...byYear].sort(([left], [right]) => left.localeCompare(right))) {
  const weathers = await fetchEventsWeather(
    events.map(({ dateIso }) => dateIso),
    today,
    (url) => fetch(url),
  );

  console.log(`${year}: ${events.length} забег(ов)`);

  for (const [index, { slug }] of events.entries()) {
    const weather = weathers[index];

    if (weather === null) {
      console.log(`  ${slug}: погода недоступна, пропуск`);
      continue;
    }

    upsert.run(
      slug,
      weather.temperatureC,
      weather.apparentC,
      weather.precipitationMm,
      weather.windKmh,
      weather.weatherCode,
      weather.recentPrecipitationMm,
    );
    fetched += 1;

    const wetCourse = weather.recentPrecipitationMm !== null && weather.recentPrecipitationMm >= WET_COURSE_PRECIPITATION_MM;

    if (wetCourse) {
      wet += 1;
    }

    console.log(
      `  ${slug}: ${weather.temperatureC}°C, ветер ${weather.windKmh} км/ч, код ${weather.weatherCode}` +
        `, осадки за окно ${weather.recentPrecipitationMm} мм${wetCourse ? ' — трасса мокрая' : ''}`,
    );
  }
}

db.query('INSERT INTO meta VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2').run(
  PROTOCOL_DB_META_SCHEMA_VERSION_KEY,
  PROTOCOL_DB_SCHEMA_VERSION,
);
db.exec('VACUUM');
db.close();
console.log(`Backfilled ${fetched} of ${pending.length} events; ${wet} of them ran on a wet course.`);

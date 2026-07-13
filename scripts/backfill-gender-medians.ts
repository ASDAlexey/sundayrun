/**
 * One-off v3 → v4 migration: adds the `median_male_ms`/`median_female_ms` columns to the
 * local data/sundayrun.db `events` table and backfills them from the stored results — the
 * same per-gender 5 km medians `buildIndexEntry` now computes on every publication.
 * Idempotent: re-running only recounts.
 * Run: bun scripts/backfill-gender-medians.ts
 */
import { Database } from 'bun:sqlite';

import { FIVE_KM_DISTANCE_KM } from '../src/app/core/history/distance.constant';
import { medianMsOrNull } from '../src/app/core/history/median';
import { Gender, GenderType } from '../src/app/core/models/gender.enum';
import {
  PROTOCOL_DB_META_SCHEMA_VERSION_KEY,
  PROTOCOL_DB_SCHEMA_VERSION,
  PROTOCOL_DB_V4_MIGRATION_STATEMENTS,
} from '../src/app/core/sqlite/protocol-db-schema.constant';

interface ResultRow {
  slug: string;
  total_ms: number | null;
  distance_km: number | null;
  gender: string | null;
}

const db = new Database('data/sundayrun.db');

const columns = db
  .query<{ name: string }, []>("SELECT name FROM pragma_table_info('events')")
  .all()
  .map((row) => row.name);

if (!columns.includes('median_male_ms')) {
  for (const statement of PROTOCOL_DB_V4_MIGRATION_STATEMENTS) {
    db.exec(statement);
  }

  console.log('Added the median_male_ms/median_female_ms columns.');
}

const resultRows = db.query<ResultRow, []>('SELECT slug, total_ms, distance_km, gender FROM results').all();
const timesBySlug = new Map<string, { male: number[]; female: number[] }>();

for (const row of resultRows) {
  if (row.distance_km !== FIVE_KM_DISTANCE_KM || row.total_ms === null) {
    continue;
  }

  const times = timesBySlug.get(row.slug) ?? { male: [], female: [] };

  if (row.gender === (Gender.male as GenderType)) {
    times.male.push(row.total_ms);
  } else if (row.gender === (Gender.female as GenderType)) {
    times.female.push(row.total_ms);
  }

  timesBySlug.set(row.slug, times);
}

const slugs = db.query<{ slug: string }, []>('SELECT slug FROM events').all();
const update = db.query('UPDATE events SET median_male_ms = ?1, median_female_ms = ?2 WHERE slug = ?3');

for (const { slug } of slugs) {
  const times = timesBySlug.get(slug) ?? { male: [], female: [] };
  const medianMale = medianMsOrNull(times.male);
  const medianFemale = medianMsOrNull(times.female);

  update.run(medianMale, medianFemale, slug);
  console.log(`${slug}: М ${medianMale ?? '—'}, Ж ${medianFemale ?? '—'}`);
}

db.query('INSERT INTO meta VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2').run(
  PROTOCOL_DB_META_SCHEMA_VERSION_KEY,
  PROTOCOL_DB_SCHEMA_VERSION,
);
db.exec('VACUUM');
db.close();
console.log(`Backfilled ${slugs.length} events.`);

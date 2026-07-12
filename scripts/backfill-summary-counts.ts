/**
 * One-off v2 → v3 migration: adds the `newcomer_count`/`personal_record_count` columns to the
 * local data/sundayrun.db `events` table and backfills them from the stored notes — the same
 * counting the db write now performs after every note recompute (see
 * src/app/core/sqlite/protocol-db-summary.ts). Idempotent: re-running only recounts.
 * Run: bun scripts/backfill-summary-counts.ts
 */
import { Database } from 'bun:sqlite';

import { isNewcomerNote, isPersonalRecordNote } from '../src/app/core/history/race-summary';
import {
  PROTOCOL_DB_META_SCHEMA_VERSION_KEY,
  PROTOCOL_DB_SCHEMA_VERSION,
  PROTOCOL_DB_V3_MIGRATION_STATEMENTS,
} from '../src/app/core/sqlite/protocol-db-schema.constant';

interface NoteRow {
  slug: string;
  note: string;
}

const db = new Database('data/sundayrun.db');

const columns = db
  .query<{ name: string }, []>("SELECT name FROM pragma_table_info('events')")
  .all()
  .map((row) => row.name);

if (!columns.includes('newcomer_count')) {
  for (const statement of PROTOCOL_DB_V3_MIGRATION_STATEMENTS) {
    db.exec(statement);
  }

  console.log('Added the newcomer_count/personal_record_count columns.');
}

const noteRows = db.query<NoteRow, []>('SELECT slug, note FROM results').all();
const countsBySlug = new Map<string, { newcomers: number; records: number }>();

for (const row of noteRows) {
  const counts = countsBySlug.get(row.slug) ?? { newcomers: 0, records: 0 };

  counts.newcomers += isNewcomerNote(row.note) ? 1 : 0;
  counts.records += isPersonalRecordNote(row.note) ? 1 : 0;
  countsBySlug.set(row.slug, counts);
}

const slugs = db.query<{ slug: string }, []>('SELECT slug FROM events').all();
const update = db.query('UPDATE events SET newcomer_count = ?1, personal_record_count = ?2 WHERE slug = ?3');

for (const { slug } of slugs) {
  const counts = countsBySlug.get(slug) ?? { newcomers: 0, records: 0 };

  update.run(counts.newcomers, counts.records, slug);
  console.log(`${slug}: ${counts.newcomers} newcomers, ${counts.records} records`);
}

db.query('INSERT INTO meta VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2').run(
  PROTOCOL_DB_META_SCHEMA_VERSION_KEY,
  PROTOCOL_DB_SCHEMA_VERSION,
);
db.exec('VACUUM');
db.close();
console.log(`Backfilled ${slugs.length} events.`);

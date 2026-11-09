/**
 * One-off fix: the protocol published as 2026-11-08 is the 2026-10-11 run — the date was not changed
 * in the form. The event is removed and re-published under the right date through the production
 * write path, so numbers, notes, rollups and `meta.overallStats` are recomputed.
 *
 * Run: bun scripts/fix-2026-11-08-date.ts
 */
import { Database } from 'bun:sqlite';
import { copyFile, readFile, writeFile } from 'node:fs/promises';

import { ProtocolRow } from '../src/app/core/models/protocol-row.interface';
import { asGender } from '../src/app/core/sqlite/protocol-db-read';
import { applyEventToDb, removeEventFromDb } from '../src/app/core/sqlite/protocol-db-write';

const DB_PATH = 'data/sundayrun.db';
const BACKUP_PATH = 'data/sundayrun.db.before-2026-11-08-date-fix';
const WRONG_SLUG = '2026-11-08';
const RIGHT_SLUG = '2026-10-11';

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

const source = new Database(DB_PATH, { readonly: true });

if (source.query('SELECT 1 FROM events WHERE slug = ?1').get(RIGHT_SLUG) !== null) {
  throw new Error(`Event ${RIGHT_SLUG} already exists — the fix has already been applied`);
}

const eventRow = source
  .query<EventRow, [string]>('SELECT number, legacy_number, city, park, club_name, chairman FROM events WHERE slug = ?1')
  .get(WRONG_SLUG);

if (eventRow === null) {
  throw new Error(`Event ${WRONG_SLUG} not found`);
}

const rows: ProtocolRow[] = source
  .query<ResultRow, [string]>(
    'SELECT idx, full_name, time23, time5, total_ms, distance_km, gender, place_m, place_f, club, note FROM results WHERE slug = ?1 ORDER BY idx',
  )
  .all(WRONG_SLUG)
  .map((row) => ({
    index: row.idx,
    fullName: row.full_name,
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

source.close();

await copyFile(DB_PATH, BACKUP_PATH);

const withoutWrong = await removeEventFromDb(new Uint8Array(await readFile(DB_PATH)), { slug: WRONG_SLUG });
const fixed = await applyEventToDb(withoutWrong, {
  event: {
    number: eventRow.number,
    legacyNumber: eventRow.legacy_number,
    dateIso: RIGHT_SLUG,
    city: eventRow.city,
    park: eventRow.park,
    clubName: eventRow.club_name,
    chairman: eventRow.chairman,
  },
  rows,
});

await writeFile(DB_PATH, fixed);

console.log(`Moved ${rows.length} results from ${WRONG_SLUG} to ${RIGHT_SLUG}. Backup: ${BACKUP_PATH}`);

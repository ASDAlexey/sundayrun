/**
 * One-off fix of the Матросов family results, as reported by Матросов Александр:
 * - 2026-04-12 spelled Егор as «Матросова Егор», which opened a second athlete;
 * - Егор's 25:21 (2025-08-24) and 24:40 (2026-03-29) were run on a cut course and are dropped;
 * - 2025-08-24 lists Александр twice; his time is 20:39, the 21:13 row repeats 2025-08-17 and is dropped.
 *
 * The events are re-published through the production write path, so notes, the athlete rollup,
 * summary counts and `meta.overallStats` are recomputed; weather and VK rows are left as they are.
 *
 * Run: bun scripts/fix-matrosov-results.ts
 */
import { Database } from 'bun:sqlite';
import { copyFile, readFile, writeFile } from 'node:fs/promises';

import { ProtocolRow } from '../src/app/core/models/protocol-row.interface';
import { RaceEvent } from '../src/app/core/models/race-event.interface';
import { asGender } from '../src/app/core/sqlite/protocol-db-read';
import { ProtocolDbEventUpdate } from '../src/app/core/sqlite/protocol-db-write.interface';
import { applyEventsToDb } from '../src/app/core/sqlite/protocol-db-write';

const DB_PATH = 'data/sundayrun.db';
const BACKUP_PATH = 'data/sundayrun.db.before-matrosov-fix';
const EGOR = 'Матросов Егор';
const ALEXANDER = 'Матросов Александр';

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

interface EventFix {
  slug: string;
  drop: (row: ResultRow) => boolean;
  rename: Record<string, string>;
}

const FIXES: EventFix[] = [
  {
    slug: '2025-08-24',
    drop: (row) => (row.full_name === ALEXANDER && row.time5 === '21:13') || row.full_name === EGOR,
    rename: {},
  },
  { slug: '2026-03-29', drop: (row) => row.full_name === EGOR, rename: {} },
  { slug: '2026-04-12', drop: () => false, rename: { 'Матросова Егор': EGOR } },
];

const source = new Database(DB_PATH, { readonly: true });

function buildUpdate(fix: EventFix): ProtocolDbEventUpdate {
  const eventRow = source
    .query<EventRow, [string]>('SELECT number, legacy_number, city, park, club_name, chairman FROM events WHERE slug = ?1')
    .get(fix.slug);

  if (eventRow === null) {
    throw new Error(`Event ${fix.slug} not found`);
  }

  const resultRows = source
    .query<ResultRow, [string]>(
      'SELECT idx, full_name, time23, time5, total_ms, distance_km, gender, place_m, place_f, club, note FROM results WHERE slug = ?1 ORDER BY idx',
    )
    .all(fix.slug);
  const kept = resultRows.filter((row) => !fix.drop(row));
  const renamed = resultRows.some((row) => row.full_name in fix.rename);

  if (kept.length === resultRows.length && !renamed) {
    throw new Error(`${fix.slug} has nothing to fix — already applied?`);
  }

  const droppedPlacesM = resultRows.reduce<number[]>((acc, row) => {
    if (fix.drop(row) && row.place_m !== null) {
      acc.push(row.place_m);
    }

    return acc;
  }, []);
  const droppedPlacesF = resultRows.reduce<number[]>((acc, row) => {
    if (fix.drop(row) && row.place_f !== null) {
      acc.push(row.place_f);
    }

    return acc;
  }, []);
  const shift = (place: number | null, dropped: number[]): number | null =>
    place === null ? null : place - dropped.filter((droppedPlace) => droppedPlace < place).length;

  const event: RaceEvent = {
    number: eventRow.number,
    legacyNumber: eventRow.legacy_number,
    dateIso: fix.slug,
    city: eventRow.city,
    park: eventRow.park,
    clubName: eventRow.club_name,
    chairman: eventRow.chairman,
  };

  const rows: ProtocolRow[] = kept.map((row, position) => ({
    index: position + 1,
    fullName: fix.rename[row.full_name] ?? row.full_name,
    time23: row.time23,
    time5: row.time5,
    totalMs: row.total_ms,
    distanceKm: row.distance_km,
    gender: asGender(row.gender),
    placeM: shift(row.place_m, droppedPlacesM),
    placeF: shift(row.place_f, droppedPlacesF),
    club: row.club,
    note: row.note,
  }));

  return { event, rows, weather: null };
}

const updates = FIXES.map((fix) => buildUpdate(fix));

source.close();

await copyFile(DB_PATH, BACKUP_PATH);

const fixedBytes = await applyEventsToDb(new Uint8Array(await readFile(DB_PATH)), updates);

await writeFile(DB_PATH, fixedBytes);

const fixed = new Database(DB_PATH, { readonly: true });

console.log(`Backup: ${BACKUP_PATH}`);

for (const fix of FIXES) {
  console.log(`\n${fix.slug}:`);

  for (const row of fixed
    .query<ResultRow, [string]>('SELECT idx, full_name, time5, place_m, place_f, note FROM results WHERE slug = ?1 ORDER BY idx')
    .all(fix.slug)) {
    console.log(`  ${row.idx} ${row.full_name} ${row.time5} M${row.place_m ?? '-'} F${row.place_f ?? '-'} '${row.note}'`);
  }
}

console.log('\nathletes:');

for (const row of fixed
  .query<{ key: string; display_name: string; best_ms: number | null }, []>(
    "SELECT key, display_name, best_ms FROM athletes WHERE key LIKE 'матросов%'",
  )
  .all()) {
  console.log(`  ${row.key} | ${row.display_name} | ${row.best_ms}`);
}

fixed.close();

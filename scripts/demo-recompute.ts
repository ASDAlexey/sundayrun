/**
 * End-to-end demo of the automatic note recompute: takes the real data/sundayrun.db (copies only,
 * the original is never touched), DELETES one event through the production `removeEventFromDb`,
 * shows how later events' notes shift, then RE-ADDS it through `applyEventToDb` and shows the
 * notes converge back. Run: bun scripts/demo-recompute.ts
 */
import { Database } from 'bun:sqlite';
import { readFile, writeFile } from 'node:fs/promises';

import { ProtocolRow } from '../src/app/core/models/protocol-row.interface';
import { RaceEvent } from '../src/app/core/models/race-event.interface';
import { asGender } from '../src/app/core/sqlite/protocol-db-read';
import { applyEventToDb, removeEventFromDb } from '../src/app/core/sqlite/protocol-db-write';

const SOURCE_DB = 'data/sundayrun.db';
const DEMO_SLUG = '2025-01-19';
const WATCH_SLUGS = [DEMO_SLUG, '2025-01-26', '2025-03-02'];

interface NoteRow {
  slug: string;
  full_name: string;
  note: string;
}

async function printNotes(title: string, bytes: Uint8Array): Promise<void> {
  const path = `/tmp/demo-recompute-${Math.random().toString(36).slice(2)}.db`;

  await Bun.write(path, bytes);

  const reopened = new Database(path, { readonly: true });
  const placeholders = WATCH_SLUGS.map(() => '?').join(',');
  const rows = reopened
    .query<NoteRow, string[]>(`SELECT slug, full_name, note FROM results WHERE slug IN (${placeholders}) AND note != '' ORDER BY slug, idx`)
    .all(...WATCH_SLUGS);

  console.log(`\n=== ${title} ===`);

  for (const row of rows) {
    console.log(`  ${row.slug}  ${row.full_name}: ${row.note}`);
  }

  reopened.close();
}

const originalBytes = new Uint8Array(await readFile(SOURCE_DB));

await printNotes(`Исходная база (следим за ${WATCH_SLUGS.join(', ')})`, originalBytes);

// Reconstruct the demo event's publication payload from the db, to re-add it later.
const source = new Database(SOURCE_DB, { readonly: true });
const eventRow = source
  .query<{ number: number; legacy_number: string | null; city: string; park: string; club_name: string; chairman: string }, [string]>(
    'SELECT number, legacy_number, city, park, club_name, chairman FROM events WHERE slug = ?1',
  )
  .get(DEMO_SLUG);

if (eventRow === null) {
  throw new Error(`Event ${DEMO_SLUG} not found`);
}

const raceEvent: RaceEvent = {
  number: eventRow.number,
  legacyNumber: eventRow.legacy_number,
  dateIso: DEMO_SLUG,
  city: eventRow.city,
  park: eventRow.park,
  clubName: eventRow.club_name,
  chairman: eventRow.chairman,
};

const protocolRows: ProtocolRow[] = source
  .query<
    {
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
    },
    [string]
  >(
    'SELECT idx, full_name, time23, time5, total_ms, distance_km, gender, place_m, place_f, club, note FROM results WHERE slug = ?1 ORDER BY idx',
  )
  .all(DEMO_SLUG)
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

// 1. Delete the event through the production write path — notes of later events shift automatically.
const afterRemoval = await removeEventFromDb(originalBytes, { slug: DEMO_SLUG });

await printNotes(`После УДАЛЕНИЯ ${DEMO_SLUG} (пересчёт выполнил removeEventFromDb)`, afterRemoval);

// 2. Re-publish it through the production write path — the notes converge back.
const afterReAdd = await applyEventToDb(afterRemoval, { event: raceEvent, rows: protocolRows });

await printNotes(`После ОБРАТНОГО ДОБАВЛЕНИЯ ${DEMO_SLUG} (пересчёт выполнил applyEventToDb)`, afterReAdd);

await writeFile('/tmp/demo-after-readd.db', afterReAdd);
console.log('\nИсходный data/sundayrun.db не изменялся; артефакт демо: /tmp/demo-after-readd.db');

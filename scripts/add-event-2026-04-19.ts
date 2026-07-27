/**
 * One-off: adds the 19.04.2026 race (ПКиО им. Горького, Таганрог) to data/sundayrun.db through the
 * production `applyEventToDb` write path — the date was missing between 12.04 and 26.04. Times come
 * from the organisers' paper protocol; auto-notes, event aggregates and the athlete rollup recompute
 * inside the write. Run: bun scripts/add-event-2026-04-19.ts
 */
import { Database } from 'bun:sqlite';
import { readFile, writeFile } from 'node:fs/promises';

import { FIVE_KM_DISTANCE_KM } from '../src/app/core/history/distance.constant';
import { Gender, GenderType } from '../src/app/core/models/gender.enum';
import { ProtocolRow } from '../src/app/core/models/protocol-row.interface';
import { RaceEvent } from '../src/app/core/models/race-event.interface';
import { parseDuration } from '../src/app/core/time/duration';
import { applyEventToDb } from '../src/app/core/sqlite/protocol-db-write';

const DB_PATH = 'data/sundayrun.db';
const SLUG = '2026-04-19';

const event: RaceEvent = {
  // Positional; `applyEventToDb` renumbers the whole archive anyway.
  number: 0,
  legacyNumber: null,
  dateIso: SLUG,
  city: 'г. Таганрог',
  park: 'ПКиО им. Горького',
  clubName: 'КЛБ «Легенда»',
  chairman: 'В.С. Хахуцкий',
};

/** [fullName, time23, time5, gender, placeM, placeF] — places are unique per gender, ties break by row order. */
const FINISHERS: [string, string, string, GenderType, number | null, number | null][] = [
  ['Хахуцкий Виктор', '8:10', '17:40', Gender.male, 1, null],
  ['Троилин Антон', '8:15', '18:13', Gender.male, 2, null],
  ['Дорожкин Михаил', '11:48', '23:53', Gender.male, 3, null],
  ['Новиков Сергей', '11:48', '25:04', Gender.male, 4, null],
  ['Волочек Павел', '11:48', '25:04', Gender.male, 5, null],
  ['Климачкин Валерий', '12:12', '26:16', Gender.male, 6, null],
  ['Дзюбак Сергей', '12:00', '26:34', Gender.male, 7, null],
  ['Зубкова Наталья', '15:47', '33:22', Gender.female, null, 1],
];

const rows: ProtocolRow[] = FINISHERS.map(([fullName, time23, time5, gender, placeM, placeF], index) => {
  const totalMs = parseDuration(time5);

  if (totalMs === null) {
    throw new Error(`Unparsable time for ${fullName}: ${time5}`);
  }

  return {
    index: index + 1,
    fullName,
    time23,
    time5,
    totalMs,
    distanceKm: FIVE_KM_DISTANCE_KM,
    gender,
    placeM,
    placeF,
    club: '',
    note: '',
  };
});

const existing = new Database(DB_PATH, { readonly: true });
const known = existing.query<{ slug: string }, [string]>('SELECT slug FROM events WHERE slug = ?1').get(SLUG);

existing.close();

if (known !== null) {
  throw new Error(`${SLUG} is already in the archive — remove it first or edit through the admin flow.`);
}

const originalBytes = new Uint8Array(await readFile(DB_PATH));
const updatedBytes = await applyEventToDb(originalBytes, { event, rows });

await writeFile(DB_PATH, updatedBytes);

const db = new Database(DB_PATH, { readonly: true });
const written = db
  .query<
    { idx: number; full_name: string; time23: string; time5: string; place_m: number | null; place_f: number | null; note: string },
    [string]
  >('SELECT idx, full_name, time23, time5, place_m, place_f, note FROM results WHERE slug = ?1 ORDER BY idx')
  .all(SLUG);
const eventRow = db
  .query<{ number: number; participant_count: number; finisher_count: number | null }, [string]>(
    'SELECT number, participant_count, finisher_count FROM events WHERE slug = ?1',
  )
  .get(SLUG);

db.close();

console.log(`Пробег № ${eventRow?.number}: участников ${eventRow?.participant_count}, финишёров ${eventRow?.finisher_count}`);

for (const row of written) {
  console.log(`  ${row.idx}. ${row.full_name}  ${row.time23} / ${row.time5}  М:${row.place_m ?? '—'} Ж:${row.place_f ?? '—'}  ${row.note}`);
}

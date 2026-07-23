/**
 * One-off: adds the 08.03.2026 race (ПКиО им. Горького, Таганрог) to data/sundayrun.db through the
 * production `applyEventToDb` write path — places, times and the DNF row are taken verbatim from
 * the organisers' paper protocol; the auto-notes, event aggregates and athlete rollup recompute
 * inside the write. Run: bun scripts/add-event-2026-03-08.ts
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
const SLUG = '2026-03-08';

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

/** [fullName, time23, time5, gender, placeM, placeF] — exactly as printed, ties share a place. */
const FINISHERS: [string, string, string, GenderType, number | null, number | null][] = [
  ['Троилин Антон', '8:42', '19:20', Gender.male, 1, null],
  ['Матросов Александр', '9:43', '21:40', Gender.male, 2, null],
  ['Нургалин Руслан', '10:43', '22:33', Gender.male, 3, null],
  ['Хахуцкий Виктор', '10:43', '22:33', Gender.male, 3, null],
  ['Волочек Павел', '11:36', '25:40', Gender.male, 4, null],
  ['Цопкало Николай', '11:36', '25:40', Gender.male, 4, null],
  ['Воронова Евгения', '12:33', '27:10', Gender.female, null, 1],
  ['Климачкин Валерий', '12:33', '27:10', Gender.male, 5, null],
  ['Цопкало Людмила', '12:33', '27:10', Gender.female, null, 1],
  ['Новиков Сергей', '12:33', '27:10', Gender.male, 5, null],
  ['Сергеев Добрыня', '12:33', '27:10', Gender.male, 5, null],
  ['Ищенко Альбина', '12:33', '27:10', Gender.female, null, 1],
  ['Лютов Никита', '12:33', '27:10', Gender.male, 5, null],
  ['Фарафонова Екатерина', '13:33', '28:01', Gender.female, null, 2],
  ['Дзюбак Сергей', '14:33', '28:01', Gender.male, 6, null],
];

const rows: ProtocolRow[] = [
  ...FINISHERS.map(([fullName, time23, time5, gender, placeM, placeF], index) => {
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
  }),
  // The archive convention for DNF keeps the recorded first lap and the DNF label in `time5`.
  {
    index: 16,
    fullName: 'Матросов Егор',
    time23: '15:33',
    time5: 'DNF',
    totalMs: null,
    distanceKm: null,
    gender: Gender.male,
    placeM: null,
    placeF: null,
    club: '',
    note: 'DNF',
  },
];

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

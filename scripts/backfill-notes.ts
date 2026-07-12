/**
 * One-off backfill: applies the same full-archive note recompute the db write now performs
 * (see src/app/core/sqlite/protocol-db-notes.ts) to the local data/sundayrun.db — chronological
 * replay, auto notes merged over manual tokens, events before the baseline kept verbatim.
 * Run: bun scripts/backfill-notes.ts
 */
import { Database } from 'bun:sqlite';

import { normalizeAthleteKey } from '../src/app/core/history/athlete-key';
import { applyEventToHistory } from '../src/app/core/history/athletes-rollup';
import { buildEventAutoNotes } from '../src/app/core/history/event-auto-notes';
import { mergeAutoNote } from '../src/app/core/history/note-merge';
import { AutoNoteInput } from '../src/app/core/history/notes-builder.interface';
import { AthletesHistory } from '../src/app/core/models/athletes-history.type';
import { Gender, GenderType } from '../src/app/core/models/gender.enum';
import { AUTO_NOTES_BASELINE_ISO } from '../src/app/core/sqlite/protocol-db-notes.constant';

const DNF_DISTANCE_KM = 0;

interface Row {
  slug: string;
  idx: number;
  full_name: string;
  total_ms: number | null;
  distance_km: number | null;
  gender: string | null;
  note: string;
}

function asGender(value: string | null): GenderType | null {
  return value === Gender.male || value === Gender.female ? value : null;
}

const db = new Database('data/sundayrun.db');
const rows = db.query<Row, []>('SELECT slug, idx, full_name, total_ms, distance_km, gender, note FROM results ORDER BY slug, idx').all();

const bySlug = new Map<string, Row[]>();

for (const row of rows) {
  const list = bySlug.get(row.slug) ?? [];
  list.push(row);
  bySlug.set(row.slug, list);
}

const update = db.query('UPDATE results SET note = ?1 WHERE slug = ?2 AND idx = ?3');
let history: AthletesHistory = {};
let updated = 0;

for (const [slug, eventRows] of bySlug) {
  if (slug >= AUTO_NOTES_BASELINE_ISO) {
    const inputs: AutoNoteInput[] = eventRows.map((row) => ({
      key: normalizeAthleteKey(row.full_name),
      gender: asGender(row.gender),
      timeMs: row.total_ms,
      distanceKm: row.distance_km ?? DNF_DISTANCE_KM,
      dateIso: slug,
    }));
    const autoNotes = buildEventAutoNotes(inputs, history, slug);

    eventRows.forEach((row, index) => {
      const note = mergeAutoNote(autoNotes[index], row.note);

      if (note !== row.note) {
        update.run(note, slug, row.idx);
        updated += 1;
        console.log(`${slug} ${row.full_name}: '${row.note}' -> '${note}'`);
      }
    });
  }

  history = applyEventToHistory(
    history,
    { slug, dateIso: slug },
    eventRows.map((row) => ({
      fullName: row.full_name,
      gender: asGender(row.gender),
      timeMs: row.total_ms,
      distanceKm: row.distance_km ?? DNF_DISTANCE_KM,
    })),
  );
}

db.exec('VACUUM');
db.close();
console.log(`Updated ${updated} rows.`);

/**
 * One-off migration: collapses shared («плотные») gender places into unique sequential ones
 * across the whole archive. Ties on the displayed time are ordered by the precise `total_ms`
 * when the timer export recorded one, then by the protocol row order (`idx`) — the paper
 * protocols carry no finer signal, so the row order stands in for the finish order.
 * Run: bun scripts/fix-tied-places.ts
 */
import { Database } from 'bun:sqlite';

const DB_PATH = 'data/sundayrun.db';

interface PlacedRow {
  idx: number;
  place: number;
  totalMs: number | null;
}

const db = new Database(DB_PATH);
const slugs = db.query<{ slug: string }, []>('SELECT slug FROM events ORDER BY slug').all();
const genderColumns = ['place_m', 'place_f'] as const;
let changedRows = 0;
const changedSlugs = new Set<string>();

db.exec('BEGIN');

for (const { slug } of slugs) {
  for (const column of genderColumns) {
    const rows = db
      .query<PlacedRow, [string]>(
        `SELECT idx, ${column} AS place, total_ms AS totalMs FROM results WHERE slug = ? AND ${column} IS NOT NULL`,
      )
      .all(slug)
      .sort((left, right) => left.place - right.place || (left.totalMs ?? 0) - (right.totalMs ?? 0) || left.idx - right.idx);

    rows.forEach((row, index) => {
      const uniquePlace = index + 1;

      if (row.place !== uniquePlace) {
        db.run(`UPDATE results SET ${column} = ? WHERE slug = ? AND idx = ?`, [uniquePlace, slug, row.idx]);
        changedRows += 1;
        changedSlugs.add(slug);
      }
    });
  }
}

db.exec('COMMIT');
console.log(`Renumbered ${changedRows} rows across ${changedSlugs.size} events: ${[...changedSlugs].join(', ')}`);

const leftovers = db
  .query<{ slug: string }, []>(
    `SELECT slug FROM results WHERE place_m IS NOT NULL GROUP BY slug, place_m HAVING COUNT(*) > 1
     UNION SELECT slug FROM results WHERE place_f IS NOT NULL GROUP BY slug, place_f HAVING COUNT(*) > 1`,
  )
  .all();

if (leftovers.length > 0) {
  throw new Error(`Duplicate places remain in: ${leftovers.map((row) => row.slug).join(', ')}`);
}

console.log('No duplicate places remain.');
db.close();

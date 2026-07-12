/**
 * Audit: replays every event in data/sundayrun.db chronologically, recomputes the auto notes
 * (первое участие / ЛР / лучший результат года / рекорд трассы) and diffs them against the
 * stored `results.note`. Tests two semantics for the year-best note:
 *   H1 — strictly beats the best result of the year among ALL athletes of the same gender;
 *   H2 — H1 or the first 5 km result of the year (nothing to beat yet).
 * Run: bun scripts/verify-notes.ts
 */
import { Database } from 'bun:sqlite';

import { normalizeAthleteKey } from '../src/app/core/history/athlete-key';
import { formatDuration } from '../src/app/core/time/duration';

const FIVE_KM = 5.0;
const HISTORICAL_CUTOFF = '2024-01-01';

interface Row {
  slug: string;
  idx: number;
  full_name: string;
  total_ms: number | null;
  distance_km: number | null;
  gender: string | null;
  note: string;
}

interface AthleteState {
  finishedRuns: number;
  best5: number | null;
}

const db = new Database('data/sundayrun.db', { readonly: true });
const rows = db.query<Row, []>('SELECT slug, idx, full_name, total_ms, distance_km, gender, note FROM results ORDER BY slug, idx').all();

const bySlug = new Map<string, Row[]>();

for (const row of rows) {
  const list = bySlug.get(row.slug) ?? [];
  list.push(row);
  bySlug.set(row.slug, list);
}

const athletes = new Map<string, AthleteState>();
const courseAll: Record<string, number | null> = { M: null, F: null };
const courseYear: Record<string, Record<string, number>> = { M: {}, F: {} };

interface Mismatch {
  slug: string;
  name: string;
  stored: string;
  expected: string;
}

const stats = {
  historicalRows: 0,
  exactH1: 0,
  exactH2: 0,
  mismatchesH1: [] as Mismatch[],
  missingModern: [] as Mismatch[],
  modernRows: 0,
};

function expectedTokens(row: Row, hypothesis: 'H1' | 'H2'): string[] {
  if (row.total_ms === null) {
    return [];
  }

  const key = normalizeAthleteKey(row.full_name);
  const state = athletes.get(key);

  if (state === undefined || state.finishedRuns === 0) {
    return ['Первое участие'];
  }

  if (row.distance_km !== FIVE_KM) {
    return [];
  }

  const tokens: string[] = [];

  if (state.best5 !== null && row.total_ms < state.best5) {
    tokens.push(`ЛР (было ${formatDuration(state.best5)})`);
  }

  const gender = row.gender;

  if (gender === 'M' || gender === 'F') {
    const year = row.slug.slice(0, 4);
    const yearBest: number | undefined = courseYear[gender][year];
    const beatsYear = yearBest === undefined ? hypothesis === 'H2' : row.total_ms < yearBest;

    if (beatsYear) {
      tokens.push(`Лучший результат ${year} г.`);
    }
  }

  return tokens;
}

function applyRow(row: Row): void {
  if (row.total_ms === null) {
    return;
  }

  const key = normalizeAthleteKey(row.full_name);
  const state = athletes.get(key) ?? { finishedRuns: 0, best5: null };

  state.finishedRuns += 1;

  if (row.distance_km === FIVE_KM) {
    if (state.best5 === null || row.total_ms < state.best5) {
      state.best5 = row.total_ms;
    }

    if (row.gender === 'M' || row.gender === 'F') {
      const year = row.slug.slice(0, 4);
      const yearBest: number | undefined = courseYear[row.gender][year];

      if (yearBest === undefined || row.total_ms < yearBest) {
        courseYear[row.gender][year] = row.total_ms;
      }

      const allBest = courseAll[row.gender];

      if (allBest === null || row.total_ms < allBest) {
        courseAll[row.gender] = row.total_ms;
      }
    }
  }

  athletes.set(key, state);
}

const AUTO_TOKEN_PATTERNS = [/^Первое участие$/, /^ЛР \(было .+\)$/, /^Лучший результат \d{4} г\.$/];

function splitTokens(note: string): string[] {
  return note
    .split(';')
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function autoTokens(note: string): string[] {
  return splitTokens(note).filter((token) => AUTO_TOKEN_PATTERNS.some((pattern) => pattern.test(token)));
}

const slugs = [...bySlug.keys()].sort();

for (const slug of slugs) {
  const eventRows = bySlug.get(slug) ?? [];
  const historical = slug < HISTORICAL_CUTOFF;

  // Sequential replay: each result is judged against the state INCLUDING earlier finishers of
  // the same event — the historical protocols mark only the first year-best of the day.
  for (const row of eventRows) {
    const storedAuto = autoTokens(row.note).join('; ');
    const h1 = expectedTokens(row, 'H1').join('; ');
    const h2 = expectedTokens(row, 'H2').join('; ');

    applyRow(row);

    if (historical) {
      stats.historicalRows += 1;

      if (storedAuto === h1) {
        stats.exactH1 += 1;
      } else {
        stats.mismatchesH1.push({ slug, name: row.full_name, stored: storedAuto, expected: h1 });
      }

      if (storedAuto === h2) {
        stats.exactH2 += 1;
      }
    } else {
      stats.modernRows += 1;

      if (storedAuto !== h1) {
        stats.missingModern.push({ slug, name: row.full_name, stored: storedAuto, expected: h1 });
      }
    }
  }
}

console.log(`Historical rows (< ${HISTORICAL_CUTOFF}): ${stats.historicalRows}`);
console.log(`  exact match H1 (strict year-best): ${stats.exactH1}`);
console.log(`  exact match H2 (incl. first of year): ${stats.exactH2}`);
console.log(`  H1 mismatches: ${stats.mismatchesH1.length}`);

const conflicts = stats.mismatchesH1.filter((mismatch) => mismatch.stored !== '');

console.log(`  H1 mismatches with a non-empty stored note (true conflicts): ${conflicts.length}`);

for (const mismatch of conflicts) {
  console.log(`    ${mismatch.slug} ${mismatch.name}: stored='${mismatch.stored}' expected='${mismatch.expected}'`);
}

console.log(`Modern rows (>= ${HISTORICAL_CUTOFF}): ${stats.modernRows}`);
console.log(`  rows whose auto note differs from H1: ${stats.missingModern.length}`);

for (const mismatch of stats.missingModern.slice(0, 40)) {
  console.log(`    ${mismatch.slug} ${mismatch.name}: stored='${mismatch.stored}' expected='${mismatch.expected}'`);
}

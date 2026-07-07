/**
 * Builds `data/protocol.db` from the JSON sources of truth (`data/index.json`,
 * `data/athletes.json` and every `data/events/<slug>/results.json`) using the shared
 * DDL from `protocol-db-schema.constant.ts` — the derived artifact for HTTP-VFS reads.
 *
 * Usage: bun scripts/build-db.ts
 */
import { Database } from 'bun:sqlite';
import { readFileSync, rmSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { ArchiveIndexFile } from '../src/app/core/github/archive-index.interface';
import { EventResultsFile } from '../src/app/core/github/results-file.interface';
import { AthletesHistory } from '../src/app/core/models/athletes-history.type';
import {
  PROTOCOL_DB_META_SCHEMA_VERSION_KEY,
  PROTOCOL_DB_SCHEMA_STATEMENTS,
  PROTOCOL_DB_SCHEMA_VERSION,
} from '../src/app/core/sqlite/protocol-db-schema.constant';

// 1 KiB pages keep HTTP VFS range requests fine-grained (docs/SQLITE_DB.md).
const PAGE_SIZE = 1024;
const dataDir = join(import.meta.dir, '..', 'data');
const dbPath = join(dataDir, 'protocol.db');

const index = JSON.parse(readFileSync(join(dataDir, 'index.json'), 'utf8')) as ArchiveIndexFile;
const athletes = JSON.parse(readFileSync(join(dataDir, 'athletes.json'), 'utf8')) as AthletesHistory;

rmSync(dbPath, { force: true });

const db = new Database(dbPath, { create: true });

// page_size only applies before the first page is written, i.e. before any DDL.
db.run(`PRAGMA page_size = ${PAGE_SIZE}`);
db.run('PRAGMA journal_mode = DELETE');

for (const statement of PROTOCOL_DB_SCHEMA_STATEMENTS) {
  db.run(statement);
}

const insertEvent = db.prepare(
  'INSERT INTO events VALUES ($slug, $dateIso, $number, $city, $park, $clubName, $chairman, $participantCount, $finisherCount, $avgTimeMs, $bestMaleMs, $bestFemaleMs)',
);
const insertResult = db.prepare(
  'INSERT INTO results VALUES ($slug, $idx, $fullName, $time23, $time5, $totalMs, $distanceKm, $gender, $placeM, $placeF, $club, $note)',
);
const insertAthlete = db.prepare('INSERT INTO athletes VALUES ($key, $displayName, $gender, $bestMs)');
const insertRun = db.prepare('INSERT INTO runs VALUES ($athleteKey, $dateIso, $slug, $timeMs, $distanceKm)');
const insertParticipation = db.prepare('INSERT INTO participations VALUES ($athleteKey, $slug)');
const insertMeta = db.prepare('INSERT INTO meta VALUES ($key, $value)');

const populate = db.transaction(() => {
  for (const entry of index.events) {
    const file = JSON.parse(readFileSync(join(dataDir, 'events', entry.slug, 'results.json'), 'utf8')) as EventResultsFile;

    insertEvent.run({
      $slug: entry.slug,
      $dateIso: entry.dateIso,
      $number: entry.number,
      $city: entry.city,
      $park: entry.park,
      $clubName: file.event.clubName ?? '',
      $chairman: file.event.chairman ?? '',
      $participantCount: entry.participantCount,
      $finisherCount: entry.finisherCount,
      $avgTimeMs: entry.avgTimeMs,
      $bestMaleMs: entry.bestMaleMs,
      $bestFemaleMs: entry.bestFemaleMs,
    });

    for (const row of file.rows) {
      insertResult.run({
        $slug: entry.slug,
        $idx: row.index,
        $fullName: row.fullName,
        $time23: row.time23,
        $time5: row.time5,
        $totalMs: row.totalMs,
        $distanceKm: row.distanceKm,
        $gender: row.gender,
        $placeM: row.placeM,
        $placeF: row.placeF,
        $club: row.club,
        $note: row.note,
      });
    }
  }

  for (const athlete of Object.values(athletes)) {
    insertAthlete.run({ $key: athlete.key, $displayName: athlete.displayName, $gender: athlete.gender, $bestMs: athlete.bestMs });

    for (const run of athlete.runs) {
      insertRun.run({
        $athleteKey: athlete.key,
        $dateIso: run.dateIso,
        $slug: run.slug,
        $timeMs: run.timeMs,
        $distanceKm: run.distanceKm,
      });
    }

    for (const slug of athlete.participationSlugs) {
      insertParticipation.run({ $athleteKey: athlete.key, $slug: slug });
    }
  }

  insertMeta.run({ $key: PROTOCOL_DB_META_SCHEMA_VERSION_KEY, $value: PROTOCOL_DB_SCHEMA_VERSION });
});

populate();

// Compact the file and rewrite every page at the configured page_size.
db.run('VACUUM');

const tables = ['events', 'results', 'athletes', 'runs', 'participations', 'meta'];

for (const table of tables) {
  const { count } = db.prepare(`SELECT count(*) AS count FROM ${table}`).get() as { count: number };

  console.log(`${table}: ${count} rows`);
}

const { page_size: pageSize } = db.prepare('PRAGMA page_size').get() as { page_size: number };

db.close();

console.log(`page_size: ${pageSize}`);
console.log(`protocol.db: ${(statSync(dbPath).size / 1024).toFixed(1)} KiB`);

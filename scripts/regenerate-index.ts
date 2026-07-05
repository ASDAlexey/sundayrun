/**
 * Rebuilds `data/index.json` from every `data/events/<slug>/results.json` via the same
 * `buildIndexEntry` the publish flow uses — a one-off backfill for new index fields.
 *
 * Usage: bun scripts/regenerate-index.ts
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildIndexEntry } from '../src/app/core/github/archive-index';
import { ARCHIVE_INDEX_SCHEMA_VERSION } from '../src/app/core/github/archive-index.constant';
import { EventResultsFile } from '../src/app/core/github/results-file.interface';

const JSON_INDENT = 2;
const dataDir = join(import.meta.dir, '..', 'data');
const eventsDir = join(dataDir, 'events');

// Directory names are `dateIso` slugs, so a reverse lexicographic sort is newest-first.
const slugs = readdirSync(eventsDir).sort().reverse();

const events = slugs.map((slug) => {
  const file = JSON.parse(readFileSync(join(eventsDir, slug, 'results.json'), 'utf8')) as EventResultsFile;

  if (file.event.dateIso !== slug) {
    throw new Error(`slug/dateIso mismatch: directory ${slug} holds an event dated ${file.event.dateIso}`);
  }

  return buildIndexEntry(file.event, file.rows);
});

// Key order mirrors the existing file: `events` first, `schemaVersion` last.
writeFileSync(
  join(dataDir, 'index.json'),
  `${JSON.stringify({ events, schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION }, null, JSON_INDENT)}\n`,
);

console.log(`regenerated index.json with ${events.length} events`);

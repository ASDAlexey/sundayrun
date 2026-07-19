/**
 * Backfills the materialised `overallStats` meta row into `data/sundayrun.db` (or the path given
 * as argv[2]). The publish flow writes this row on every publication (see `storeOverallStats`), so
 * this one-off only exists to add it to a db built before the key existed — after which the home
 * page reads a single keyed row instead of scanning `runs` three times over HTTP range requests.
 *
 * It reads the athletes rollup back out of the db and stores `computeOverallStats(history)` — the
 * exact value the next publication would produce — so it is idempotent and faithful. Every other
 * table (results, athletes, the copy-protection canary row) is exported untouched.
 *
 * Usage: bun scripts/backfill-overall-stats.ts [path/to/sundayrun.db]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { deserializeDbInto } from '../src/app/core/sqlite/deserialize-db';
import { narrowValues } from '../src/app/core/sqlite/protocol-db-narrow';
import { storeOverallStats } from '../src/app/core/sqlite/protocol-db-overall-stats';
import { readHistory } from '../src/app/core/sqlite/protocol-db-read';
import { createProtocolDrizzle } from '../src/app/core/sqlite/protocol-drizzle';
import { loadSqlite3Node } from '../src/app/core/sqlite/sqlite-loader-node';

const dbPath = process.argv[2] ?? join(import.meta.dir, '..', 'data', 'sundayrun.db');

const sqlite3 = await loadSqlite3Node();
const db = new sqlite3.oo1.DB();

try {
  deserializeDbInto(sqlite3, db, new Uint8Array(await readFile(dbPath)));

  const ddb = createProtocolDrizzle({
    queryValues: (sql, params) =>
      Promise.resolve(db.exec(sql, { bind: [...params], rowMode: 'array', returnValue: 'resultRows' }).map(narrowValues)),
  });
  const history = await readHistory(ddb);

  await storeOverallStats(ddb, history);
  await writeFile(dbPath, sqlite3.capi.sqlite3_js_db_export(db));

  console.log(`Backfilled overallStats into ${dbPath}`);
} finally {
  db.close();
}

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { exportMemoryProtocolDbBytes } from '../core/sqlite/spec-utils/protocol-db-memory';
import { createNodeProtocolDb } from './protocol-db-node';
import { MISSING_DB_PATH, NODE_EXPECTED_ROWS, NODE_QUERY_PARAMS, NODE_QUERY_SQL, NODE_SEED_SQL } from './protocol-db-node.mock';

describe('createNodeProtocolDb', () => {
  let dir: string | null = null;

  afterEach(async () => {
    if (dir !== null) {
      await rm(dir, { recursive: true, force: true });
      dir = null;
    }
  });

  it('opens the local db once and answers value-array queries with narrowed rows', async () => {
    dir = await mkdtemp(join(tmpdir(), 'protocol-db-node-'));
    const dbPath = join(dir, 'protocol.db');

    await writeFile(dbPath, await exportMemoryProtocolDbBytes(NODE_SEED_SQL));

    const db = createNodeProtocolDb(dbPath);

    await expect(db.queryValues(NODE_QUERY_SQL, NODE_QUERY_PARAMS)).resolves.toEqual(NODE_EXPECTED_ROWS);
    await expect(db.queryValues(NODE_QUERY_SQL, NODE_QUERY_PARAMS), 'the cached connection is reused').resolves.toEqual(NODE_EXPECTED_ROWS);
    await expect(db.queryValues('SELECT slug FROM events WHERE slug = ?', ['нет']), 'an unmatched key yields no rows').resolves.toEqual([]);
  });

  it('rejects the query when the local db file is missing', async () => {
    await expect(createNodeProtocolDb(MISSING_DB_PATH).queryValues(NODE_QUERY_SQL, NODE_QUERY_PARAMS)).rejects.toThrow();
  });
});

import { createMemoryProtocolDb } from '../core/sqlite/spec-utils/protocol-db-memory';
import { createProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import { EXPECTED_DB_PACING_ROWS, POPULATED_SEED, SEED_PACING_EDGE_RESULTS } from './protocol-db-queries.mock';
import { selectPacingRows } from './protocol-db-pacing';

describe('protocol-db-pacing', () => {
  let close: (() => void) | null = null;

  afterEach(() => {
    close?.();
    close = null;
  });

  it('reads every split-bearing 5 km finish oldest first, and an empty archive resolves none', async () => {
    const populated = await createMemoryProtocolDb([...POPULATED_SEED, ...SEED_PACING_EDGE_RESULTS]);

    close = populated.close;

    await expect(
      selectPacingRows(createProtocolDrizzle(populated.db)),
      'the unparsable split and the total-less row fall out in code',
    ).resolves.toEqual(EXPECTED_DB_PACING_ROWS);

    populated.close();

    const empty = await createMemoryProtocolDb([]);

    close = empty.close;

    await expect(selectPacingRows(createProtocolDrizzle(empty.db)), 'an empty archive has no splits').resolves.toEqual([]);
  });
});

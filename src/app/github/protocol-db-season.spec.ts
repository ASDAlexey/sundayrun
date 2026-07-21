import { createMemoryProtocolDb } from '../core/sqlite/spec-utils/protocol-db-memory';
import { createProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import {
  EXPECTED_SEASON_LAP_RUNS_WITH_EDGES,
  EXPECTED_SEASON_RUNS,
  POPULATED_SEED,
  SEASON_RUNS_YEAR,
  SEED_SEASON_LAP_EDGE_RESULTS,
} from './protocol-db-queries.mock';
import { selectSeasonLapRuns, selectSeasonRuns } from './protocol-db-season';

describe('protocol-db-season', () => {
  let close: (() => void) | null = null;

  afterEach(() => {
    close?.();
    close = null;
  });

  it('cuts one season of 5 km finishes for both genders, and an empty archive resolves no runs', async () => {
    const populated = await createMemoryProtocolDb([...POPULATED_SEED, ...SEED_SEASON_LAP_EDGE_RESULTS]);

    close = populated.close;
    const db = createProtocolDrizzle(populated.db);

    await expect(selectSeasonRuns(db, SEASON_RUNS_YEAR)).resolves.toEqual(EXPECTED_SEASON_RUNS);
    await expect(
      selectSeasonLapRuns(db, SEASON_RUNS_YEAR),
      'every row with a parseable split and a sane gender enters the lap standings, 5 km finish or not',
    ).resolves.toEqual(EXPECTED_SEASON_LAP_RUNS_WITH_EDGES);

    populated.close();

    const empty = await createMemoryProtocolDb([]);

    close = empty.close;
    const emptyDb = createProtocolDrizzle(empty.db);

    await expect(selectSeasonRuns(emptyDb, SEASON_RUNS_YEAR), 'an empty archive has no season runs').resolves.toEqual([]);
    await expect(selectSeasonLapRuns(emptyDb, SEASON_RUNS_YEAR), 'an empty archive has no season laps').resolves.toEqual([]);
  });
});

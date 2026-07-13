import { createMemoryProtocolDb } from '../core/sqlite/spec-utils/protocol-db-memory';
import { createProtocolDrizzle, ProtocolDrizzle } from '../core/sqlite/protocol-drizzle';
import { EXPECTED_DB_BADGE_RARITY, EXPECTED_DB_YEAR_BEST_ROWS } from './protocol-db-badges.mock';
import { selectYearBadgeRarity, selectYearBestRows } from './protocol-db-badges';
import { POPULATED_SEED, YEAR_REVIEW_SEED } from './protocol-db-queries.mock';

describe('protocol-db-badges', () => {
  let close: (() => void) | null = null;

  afterEach(() => {
    close?.();
    close = null;
  });

  async function drizzleFor(seed: readonly string[]): Promise<ProtocolDrizzle> {
    const memory = await createMemoryProtocolDb(seed);

    close = memory.close;

    return createProtocolDrizzle(memory.db);
  }

  it('serves the year bests and folds the ranking crowns into the badge rarity', async () => {
    const db = await drizzleFor(POPULATED_SEED);

    await expect(selectYearBestRows(db)).resolves.toEqual(EXPECTED_DB_YEAR_BEST_ROWS);
    await expect(selectYearBadgeRarity(db), 'no activity badge is reached, but both one-lane tables crown their athletes').resolves.toEqual(
      EXPECTED_DB_BADGE_RARITY,
    );
  });

  it('drops the corrupt gender code from the ranking scan and stays empty on an empty db', async () => {
    const db = await drizzleFor(YEAR_REVIEW_SEED);

    await expect(selectYearBestRows(db), 'the corrupt gender code never ranks').resolves.toEqual(EXPECTED_DB_YEAR_BEST_ROWS);

    close?.();

    const empty = await drizzleFor([]);

    await expect(selectYearBestRows(empty)).resolves.toEqual([]);
    await expect(selectYearBadgeRarity(empty), 'no participants — no rarity').resolves.toEqual({});
  });
});

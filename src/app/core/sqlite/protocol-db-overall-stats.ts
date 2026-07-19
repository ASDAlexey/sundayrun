import { computeOverallStats } from '../history/overall-stats';
import { AthletesHistory } from '../models/athletes-history.type';
import { meta } from './protocol-db.schema';
import { PROTOCOL_DB_META_OVERALL_STATS_KEY } from './protocol-db-schema.constant';
import { ProtocolDrizzle } from './protocol-drizzle';

/**
 * Materialises the site-wide totals (`OverallStats`) into the `meta` kv row `overallStats`, so the
 * home page reads a single keyed lookup instead of scanning `runs` three times over HTTP range
 * requests. The totals come straight from the in-memory rollup — `computeOverallStats` already
 * yields the exact shape — so this stays a pure write, no re-scan of the db. Runs in the publish
 * transaction next to `recomputeEventSummaryCounts`, so the stored value always matches the tables.
 */
export async function storeOverallStats(db: ProtocolDrizzle, history: AthletesHistory): Promise<void> {
  const value = JSON.stringify(computeOverallStats(history));

  await db.insert(meta).values({ key: PROTOCOL_DB_META_OVERALL_STATS_KEY, value }).onConflictDoUpdate({ target: meta.key, set: { value } });
}

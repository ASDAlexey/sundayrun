import { DATA_DIRECTORY } from './protocols-repo.constant';

/**
 * The deploy bundles a second copy of the db named by the data commit `version.json` points at
 * (see `ci.yml`): a publication changes the name, so neither the browser nor the Pages CDN can
 * answer for it with a stale copy. The plain `sundayrun.db` stays alongside as the fallback the
 * app reads while the deploy carrying a fresh publication is still in flight.
 */
export function pinnedProtocolDbPath(sha: string): string {
  return `${DATA_DIRECTORY}sundayrun-${sha}.db`;
}

import { removeEventFromDb } from '../sqlite/protocol-db-write';
import { eventFilePaths } from './event-paths';
import { EventFilePaths } from './event-paths.interface';
import { DELETE_COMMIT_MESSAGE_PREFIX } from './github-api.constant';
import { CommitFile } from './github-api.interface';
import { commitFilesAtomically } from './github-commit';
import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { GithubFetchFn } from './github-fetch.type';
import { buildProtocolDbCommitFile } from './protocol-db-file';
import { publishVersionPointer } from './version-pointer';

/**
 * The mirror of `publishEvent`: removes one published event from the protocols repository as a
 * single atomic commit — the `source.xlsx` workbook is deleted and the derived `sundayrun.db` is
 * rewritten without the event's entry, rollup contribution and results rows. The db is downloaded
 * fresh on every commit attempt (a concurrent publication is merged, not overwritten) and is the
 * single source of truth, so a rebuild failure fails the deletion. Finishes by pointing
 * `version.json` at the new commit — the sha-pinned data urls are immutable, so nothing else needs a
 * purge. Returns the deletion commit sha, so the session can pin its reads to it.
 */
export async function deleteEvent(token: string, slug: string, fetchFn: GithubFetchFn = DEFAULT_GITHUB_FETCH): Promise<string> {
  const paths = eventFilePaths(slug);

  const commitSha = await commitFilesAtomically(
    token,
    () => buildCommitFiles(fetchFn, token, slug, paths),
    `${DELETE_COMMIT_MESSAGE_PREFIX}${slug}`,
    fetchFn,
  );

  await publishVersionPointer(token, slug, commitSha, fetchFn);

  return commitSha;
}

/** Re-downloads `sundayrun.db`, drops the slug from it and deletes the source workbook; once per attempt. */
async function buildCommitFiles(fetchFn: GithubFetchFn, token: string, slug: string, paths: EventFilePaths): Promise<CommitFile[]> {
  const dbFile = await buildProtocolDbCommitFile(token, (dbBytes) => removeEventFromDb(dbBytes, { slug }), fetchFn);

  return [{ path: paths.sourceXlsx, base64Content: null }, dbFile];
}

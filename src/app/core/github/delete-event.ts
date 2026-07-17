import { removeEventFromDb } from '../sqlite/protocol-db-write';
import { DeleteEventResult } from './delete-event.interface';
import { eventFilePaths } from './event-paths';
import { EventFilePaths } from './event-paths.interface';
import { DELETE_COMMIT_MESSAGE_PREFIX } from './github-api.constant';
import { CommitFile } from './github-api.interface';
import { commitFilesAtomically } from './github-commit';
import { GithubAuthError } from './github-errors';
import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { GithubFetchFn } from './github-fetch.type';
import { buildProtocolDbCommitFile } from './protocol-db-file';
import { publishVersionPointer } from './version-pointer';
import { DEFAULT_SLEEP } from './version-pointer.constant';
import { SleepFn } from './version-pointer.type';

/**
 * The mirror of `publishEvent`: removes one published event from the protocols repository as a
 * single atomic commit — the `source.xlsx` workbook is deleted and the derived `sundayrun.db` is
 * rewritten without the event's entry, rollup contribution and results rows. The db is downloaded
 * fresh on every commit attempt (a concurrent publication is merged, not overwritten) and is the
 * single source of truth, so a rebuild failure fails the deletion. Once that data commit lands the
 * event is gone, so a version-pointer that still cannot commit (after its retries) is reported as
 * `pointerPublished: false` — the deletion is done, the pointer just lags — rather than throwing.
 * Only an auth failure or a failed data commit rejects. Returns the deletion commit sha to pin.
 */
export async function deleteEvent(
  token: string,
  slug: string,
  fetchFn: GithubFetchFn = DEFAULT_GITHUB_FETCH,
  sleep: SleepFn = DEFAULT_SLEEP,
): Promise<DeleteEventResult> {
  const paths = eventFilePaths(slug);

  const commitSha = await commitFilesAtomically(
    token,
    () => buildCommitFiles(fetchFn, token, slug, paths),
    `${DELETE_COMMIT_MESSAGE_PREFIX}${slug}`,
    fetchFn,
  );

  try {
    await publishVersionPointer(token, slug, commitSha, fetchFn, sleep);

    return { commitSha, pointerPublished: true };
  } catch (error) {
    // A bad token is terminal; any other pointer failure leaves the deletion done but not yet visible.
    if (error instanceof GithubAuthError) {
      throw error;
    }

    return { commitSha, pointerPublished: false };
  }
}

/** Re-downloads `sundayrun.db`, drops the slug from it and deletes the source workbook; once per attempt. */
async function buildCommitFiles(fetchFn: GithubFetchFn, token: string, slug: string, paths: EventFilePaths): Promise<CommitFile[]> {
  const dbFile = await buildProtocolDbCommitFile(token, (dbBytes) => removeEventFromDb(dbBytes, { slug }), fetchFn);

  return [{ path: paths.sourceXlsx, base64Content: null }, dbFile];
}

import { removeEventFromDb } from '../sqlite/protocol-db-write';
import { type DeleteEventResult } from './delete-event.interface';
import { eventFilePaths } from './event-paths';
import { type EventFilePaths } from './event-paths.interface';
import { DELETE_COMMIT_MESSAGE_PREFIX } from './github-api.constant';
import { type CommitFile } from './github-api.interface';
import { commitFilesAtomically } from './github-commit';
import { GithubAuthError } from './github-errors';
import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { type GithubAccess, type GithubFetchFn } from './github-fetch.type';
import { buildProtocolDbCommitFile } from './protocol-db-file';
import { repoFileExists } from './repo-contents';
import { publishVersionPointer } from './version-pointer';
import { DEFAULT_SLEEP } from './version-pointer.constant';
import { type SleepFn } from './version-pointer.type';

/** Which event to unpublish, plus the transport and the backoff the pointer retry uses. */
export interface DeleteEventRequest {
  readonly token: string;
  readonly slug: string;
  readonly fetchFn?: GithubFetchFn;
  readonly sleep?: SleepFn;
}

/** What one commit attempt of a deletion works on; `parentSha` moves when the branch does. */
interface DeleteAttempt {
  readonly slug: string;
  readonly paths: EventFilePaths;
  readonly parentSha: string;
}

/**
 * The mirror of `publishEvent`: removes one published event from the protocols repository as a
 * single atomic commit — the `source.xlsx` workbook is deleted (when the event has one) and the derived `sundayrun.db` is
 * rewritten without the event's entry, rollup contribution and results rows. The db is downloaded
 * fresh on every commit attempt (a concurrent publication is merged, not overwritten) and is the
 * single source of truth, so a rebuild failure fails the deletion. Once that data commit lands the
 * event is gone, so a version-pointer that still cannot commit (after its retries) is reported as
 * `pointerPublished: false` — the deletion is done, the pointer just lags — rather than throwing.
 * Only an auth failure or a failed data commit rejects. Returns the deletion commit sha to pin.
 */
export async function deleteEvent(request: DeleteEventRequest): Promise<DeleteEventResult> {
  const { token, slug, fetchFn = DEFAULT_GITHUB_FETCH, sleep = DEFAULT_SLEEP } = request;
  const access: GithubAccess = { token, fetchFn };
  const paths = eventFilePaths(slug);

  const commitSha = await commitFilesAtomically({
    token,
    fetchFn,
    buildFiles: (parentSha) => buildCommitFiles(access, { slug, paths, parentSha }),
    message: `${DELETE_COMMIT_MESSAGE_PREFIX}${slug}`,
  });

  try {
    await publishVersionPointer({ token, slug, dataCommitSha: commitSha, fetchFn, sleep });

    return { commitSha, pointerPublished: true };
  } catch (error) {
    // A bad token is terminal; any other pointer failure leaves the deletion done but not yet visible.
    if (error instanceof GithubAuthError) {
      throw error;
    }

    return { commitSha, pointerPublished: false };
  }
}

/**
 * Re-downloads `sundayrun.db`, drops the slug from it and deletes the source workbook; once per
 * attempt. An event timed by the built-in stopwatch never had a workbook, and the Git Data API
 * rejects a deletion of a path that is not there, so the workbook is probed (per attempt too — the
 * repository can move between attempts) and only an existing one joins the commit.
 */
async function buildCommitFiles(access: GithubAccess, attempt: DeleteAttempt): Promise<CommitFile[]> {
  const { slug, paths, parentSha } = attempt;
  const [dbFile, sourceXlsxExists] = await Promise.all([
    buildProtocolDbCommitFile(access, { updateDb: (dbBytes) => removeEventFromDb(dbBytes, { slug }), parentSha }),
    repoFileExists(paths.sourceXlsx, access),
  ]);

  return sourceXlsxExists ? [{ path: paths.sourceXlsx, base64Content: null }, dbFile] : [dbFile];
}

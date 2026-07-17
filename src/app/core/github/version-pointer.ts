import { commitFilesAtomically } from './github-commit';
import { GithubAuthError } from './github-errors';
import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { GithubFetchFn } from './github-fetch.type';
import { jsonToBase64 } from './json-base64';
import { purgeJsDelivrPaths } from './jsdelivr';
import { VERSION_JSON_PATH } from './protocols-repo.constant';
import { VERSION_FILE_SCHEMA_VERSION } from './version-file.constant';
import { VersionFile } from './version-file.interface';
import {
  DEFAULT_SLEEP,
  VERSION_COMMIT_MESSAGE_PREFIX,
  VERSION_POINTER_MAX_ATTEMPTS,
  VERSION_POINTER_RETRY_DELAY_MS,
} from './version-pointer.constant';
import { SleepFn } from './version-pointer.type';
import { CommitFile } from './github-api.interface';

/**
 * Second mini-commit of every publication: points `data/version.json` at the just-created data
 * commit, then best-effort purges its CDN path — the pointer is the only file read via the branch
 * url, so the sha-pinned data urls never need a purge. The data commit has already landed, so the
 * branch ref may read stale for a beat and trip the atomic commit's fast-forward — the pointer is
 * therefore retried with a backoff before it gives up. A final failure still propagates: without
 * the pointer other visitors keep reading the previous version, so `publishEvent` reports the
 * publication as failed; `deleteEvent` treats it as pending instead (re-running is idempotent).
 */
export async function publishVersionPointer(
  token: string,
  slug: string,
  dataCommitSha: string,
  fetchFn: GithubFetchFn = DEFAULT_GITHUB_FETCH,
  sleep: SleepFn = DEFAULT_SLEEP,
): Promise<void> {
  const pointer: VersionFile = { schemaVersion: VERSION_FILE_SCHEMA_VERSION, sha: dataCommitSha };
  const buildFiles = (): Promise<CommitFile[]> => Promise.resolve([{ path: VERSION_JSON_PATH, base64Content: jsonToBase64(pointer) }]);
  const message = `${VERSION_COMMIT_MESSAGE_PREFIX}${slug}`;

  await commitPointerWithRetry(token, buildFiles, message, fetchFn, sleep);

  await purgeJsDelivrPaths([VERSION_JSON_PATH], fetchFn);
}

/** Commits the pointer, retrying a stale-ref failure after a backoff; auth failures are terminal. */
async function commitPointerWithRetry(
  token: string,
  buildFiles: () => Promise<CommitFile[]>,
  message: string,
  fetchFn: GithubFetchFn,
  sleep: SleepFn,
): Promise<void> {
  for (let attempt = 1; attempt <= VERSION_POINTER_MAX_ATTEMPTS; attempt += 1) {
    try {
      await commitFilesAtomically(token, buildFiles, message, fetchFn);

      return;
    } catch (error) {
      if (error instanceof GithubAuthError || attempt === VERSION_POINTER_MAX_ATTEMPTS) {
        throw error;
      }

      await sleep(VERSION_POINTER_RETRY_DELAY_MS);
    }
  }
}

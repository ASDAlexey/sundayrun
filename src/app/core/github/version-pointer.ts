import { commitFilesAtomically } from './github-commit';
import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { GithubFetchFn } from './github-fetch.type';
import { jsonToBase64 } from './json-base64';
import { purgeJsDelivrPaths } from './jsdelivr';
import { VERSION_JSON_PATH } from './protocols-repo.constant';
import { VERSION_FILE_SCHEMA_VERSION } from './version-file.constant';
import { VersionFile } from './version-file.interface';
import { VERSION_COMMIT_MESSAGE_PREFIX } from './version-pointer.constant';

/**
 * Second mini-commit of every publication: points `data/version.json` at the just-created data
 * commit, then best-effort purges its CDN path — the pointer is the only file read via the
 * branch url, so the sha-pinned data urls never need a purge. A pointer commit failure
 * propagates: without it other visitors would keep reading the previous version, so the caller
 * must report the publication as failed (re-running it is idempotent).
 */
export async function publishVersionPointer(
  token: string,
  slug: string,
  dataCommitSha: string,
  fetchFn: GithubFetchFn = DEFAULT_GITHUB_FETCH,
): Promise<void> {
  const pointer: VersionFile = { schemaVersion: VERSION_FILE_SCHEMA_VERSION, sha: dataCommitSha };

  await commitFilesAtomically(
    token,
    () => Promise.resolve([{ path: VERSION_JSON_PATH, base64Content: jsonToBase64(pointer) }]),
    `${VERSION_COMMIT_MESSAGE_PREFIX}${slug}`,
    fetchFn,
  );

  await purgeJsDelivrPaths([VERSION_JSON_PATH], fetchFn);
}

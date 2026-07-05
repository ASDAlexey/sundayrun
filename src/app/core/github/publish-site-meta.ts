import { commitFilesAtomically } from './github-commit';
import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { GithubFetchFn } from './github-fetch.type';
import { jsonToBase64 } from './json-base64';
import { purgeJsDelivrPaths } from './jsdelivr';
import { SITE_META_JSON_PATH } from './protocols-repo.constant';
import { SITE_META_COMMIT_MESSAGE } from './publish-site-meta.constant';
import { SiteMetaFile } from './site-meta.interface';

/**
 * Commits `site-meta.json` into the protocols repository and purges its CDN path, so the
 * home-page announcement updates promptly. Returns the new commit sha.
 */
export async function publishSiteMeta(token: string, meta: SiteMetaFile, fetchFn: GithubFetchFn = DEFAULT_GITHUB_FETCH): Promise<string> {
  const commitSha = await commitFilesAtomically(
    token,
    () => Promise.resolve([{ path: SITE_META_JSON_PATH, base64Content: jsonToBase64(meta) }]),
    SITE_META_COMMIT_MESSAGE,
    fetchFn,
  );

  await purgeJsDelivrPaths([SITE_META_JSON_PATH], fetchFn);

  return commitSha;
}

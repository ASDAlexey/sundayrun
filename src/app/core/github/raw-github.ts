import { PROTOCOLS_REPO_BRANCH, PROTOCOLS_REPO_NAME, PROTOCOLS_REPO_OWNER } from './protocols-repo.constant';
import { RAW_GITHUB_BASE_URL } from './raw-github.constant';

/**
 * GitHub's own raw url of a repository file at the branch head. Unlike a jsDelivr branch url
 * (served for up to a week, purge-dependent, and observed stale even after a successful purge),
 * raw content is cached for at most `max-age=300` and sends `Access-Control-Allow-Origin: *`,
 * so a branch read here is never more than five minutes behind a publication.
 */
export function rawGithubFileUrl(path: string): string {
  return `${RAW_GITHUB_BASE_URL}${PROTOCOLS_REPO_OWNER}/${PROTOCOLS_REPO_NAME}/${PROTOCOLS_REPO_BRANCH}/${path}`;
}

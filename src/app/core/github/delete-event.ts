import { removeEventFromHistory } from '../history/athletes-rollup';
import { parseArchiveIndex, removeIndexEntry } from './archive-index';
import { eventFilePaths } from './event-paths';
import { EventFilePaths } from './event-paths.interface';
import { DELETE_COMMIT_MESSAGE_PREFIX } from './github-api.constant';
import { CommitFile } from './github-api.interface';
import { commitFilesAtomically } from './github-commit';
import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { GithubFetchFn } from './github-fetch.type';
import { parseAthletesHistory } from './history-file';
import { jsonToBase64 } from './json-base64';
import { purgeJsDelivrPaths } from './jsdelivr';
import { ATHLETES_JSON_PATH, INDEX_JSON_PATH } from './protocols-repo.constant';
import { fetchRepoFileText } from './repo-contents';

/**
 * The mirror of `publishEvent`: removes one published event from the protocols repository as a
 * single atomic commit — the three per-event files are deleted and `index.json`/`athletes.json`
 * are rewritten without the event's index entry and rollup contribution. The commit files are
 * rebuilt from fresh repository reads on every retry, so a concurrent publication is merged
 * instead of overwritten. Finishes with a best-effort jsDelivr purge of every touched path.
 */
export async function deleteEvent(token: string, slug: string, fetchFn: GithubFetchFn = DEFAULT_GITHUB_FETCH): Promise<void> {
  const paths = eventFilePaths(slug);

  await commitFilesAtomically(
    token,
    () => buildCommitFiles(fetchFn, token, slug, paths),
    `${DELETE_COMMIT_MESSAGE_PREFIX}${slug}`,
    fetchFn,
  );

  await purgeJsDelivrPaths(touchedPaths(paths), fetchFn);
}

/** Re-reads `index.json`/`athletes.json` and rebuilds all five commit entries; invoked once per commit attempt. */
async function buildCommitFiles(fetchFn: GithubFetchFn, token: string, slug: string, paths: EventFilePaths): Promise<CommitFile[]> {
  const [indexText, historyText] = await Promise.all([
    fetchRepoFileText(token, INDEX_JSON_PATH, fetchFn),
    fetchRepoFileText(token, ATHLETES_JSON_PATH, fetchFn),
  ]);
  const index = removeIndexEntry(parseArchiveIndex(indexText), slug);
  const history = removeEventFromHistory(parseAthletesHistory(historyText), slug);

  return [
    { path: paths.sourceXlsx, base64Content: null },
    { path: paths.protocolPdf, base64Content: null },
    { path: paths.resultsJson, base64Content: null },
    { path: INDEX_JSON_PATH, base64Content: jsonToBase64(index) },
    { path: ATHLETES_JSON_PATH, base64Content: jsonToBase64(history) },
  ];
}

/** Every repository path touched by the deletion commit, in commit order. */
function touchedPaths(paths: EventFilePaths): string[] {
  return [paths.sourceXlsx, paths.protocolPdf, paths.resultsJson, INDEX_JSON_PATH, ATHLETES_JSON_PATH];
}

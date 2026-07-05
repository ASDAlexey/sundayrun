import { bytesToBase64 } from '../encoding/base64';
import { applyEventToHistory, removeEventFromHistory } from '../history/athletes-rollup';
import { buildIndexEntry, parseArchiveIndex, upsertIndexEntry } from './archive-index';
import { eventFilePaths } from './event-paths';
import { EventFilePaths } from './event-paths.interface';
import { COMMIT_MESSAGE_PREFIX } from './github-api.constant';
import { CommitFile } from './github-api.interface';
import { commitFilesAtomically } from './github-commit';
import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { GithubFetchFn } from './github-fetch.type';
import { parseAthletesHistory } from './history-file';
import { jsonToBase64 } from './json-base64';
import { jsDelivrFileUrl, purgeJsDelivrPaths } from './jsdelivr';
import { ATHLETES_JSON_PATH, INDEX_JSON_PATH } from './protocols-repo.constant';
import { PublishEventInput, PublishEventResult } from './publish-event.interface';
import { fetchRepoFileText } from './repo-contents';
import { buildEventResultsFile, toEventResults } from './results-file';

/**
 * Publishes one event into the protocols repository as a single atomic commit: the three
 * per-event files plus the updated `index.json` and `athletes.json`. Re-publishing the same
 * date first removes the previous rollup contribution, so the operation is idempotent.
 * The commit files are rebuilt from fresh repository reads on every retry, so a concurrent
 * publication is merged instead of overwritten. Finishes with a best-effort jsDelivr purge;
 * the returned `pdfUrl` is pinned to the commit sha.
 */
export async function publishEvent(
  token: string,
  input: PublishEventInput,
  fetchFn: GithubFetchFn = DEFAULT_GITHUB_FETCH,
): Promise<PublishEventResult> {
  const paths = eventFilePaths(input.event.dateIso);
  const commitSha = await commitFilesAtomically(
    token,
    () => buildCommitFiles(fetchFn, token, input, paths),
    `${COMMIT_MESSAGE_PREFIX}${input.event.dateIso}`,
    fetchFn,
  );

  await purgeJsDelivrPaths(publishedPaths(paths), fetchFn);

  return { commitSha, pdfUrl: jsDelivrFileUrl(paths.protocolPdf, commitSha) };
}

/** Re-reads `index.json`/`athletes.json` and rebuilds all five files; invoked once per commit attempt. */
async function buildCommitFiles(
  fetchFn: GithubFetchFn,
  token: string,
  input: PublishEventInput,
  paths: EventFilePaths,
): Promise<CommitFile[]> {
  const [indexText, historyText] = await Promise.all([
    fetchRepoFileText(token, INDEX_JSON_PATH, fetchFn),
    fetchRepoFileText(token, ATHLETES_JSON_PATH, fetchFn),
  ]);
  const { event, rows } = input;
  const slug = event.dateIso;
  const previousHistory = removeEventFromHistory(parseAthletesHistory(historyText), slug);
  const history = applyEventToHistory(previousHistory, { slug, dateIso: event.dateIso }, toEventResults(rows));
  const index = upsertIndexEntry(parseArchiveIndex(indexText), buildIndexEntry(event, rows));

  return [
    { path: paths.sourceXlsx, base64Content: bytesToBase64(input.sourceXlsxBytes) },
    { path: paths.protocolPdf, base64Content: bytesToBase64(input.pdfBytes) },
    { path: paths.resultsJson, base64Content: jsonToBase64(buildEventResultsFile(event, rows)) },
    { path: INDEX_JSON_PATH, base64Content: jsonToBase64(index) },
    { path: ATHLETES_JSON_PATH, base64Content: jsonToBase64(history) },
  ];
}

/** Every repository path touched by the publish commit, in upload order. */
function publishedPaths(paths: EventFilePaths): string[] {
  return [paths.sourceXlsx, paths.protocolPdf, paths.resultsJson, INDEX_JSON_PATH, ATHLETES_JSON_PATH];
}

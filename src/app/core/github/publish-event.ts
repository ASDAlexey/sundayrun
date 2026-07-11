import { bytesToBase64 } from '../encoding/base64';
import { applyEventToHistory, removeEventFromHistory } from '../history/athletes-rollup';
import { applyEventToDb } from '../sqlite/protocol-db-write';
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
import { buildProtocolDbCommitFile } from './protocol-db-file';
import { ATHLETES_JSON_PATH, INDEX_JSON_PATH } from './protocols-repo.constant';
import { PublishCommitAttempt, PublishEventInput, PublishEventResult } from './publish-event.interface';
import { fetchRepoFileText } from './repo-contents';
import { buildEventResultsFile, toEventResults } from './results-file';
import { publishVersionPointer } from './version-pointer';

/**
 * Publishes one event into the protocols repository as a single atomic commit: the two
 * per-event files plus the updated `index.json`, `athletes.json` and the derived
 * `protocol.db`. Re-publishing the same date first removes the previous rollup contribution,
 * so the operation is idempotent. The commit files are rebuilt from fresh repository reads on
 * every retry, so a concurrent publication is merged instead of overwritten. When the db
 * rebuild fails the publication still goes through without it (`dbSkipped` in the result).
 * Finishes by pointing `version.json` at the new commit — the sha-pinned data urls are
 * immutable, so nothing else needs a purge. The returned sha references the data commit; the
 * protocol PDF is generated on the fly from the results, never stored.
 */
export async function publishEvent(
  token: string,
  input: PublishEventInput,
  fetchFn: GithubFetchFn = DEFAULT_GITHUB_FETCH,
): Promise<PublishEventResult> {
  const paths = eventFilePaths(input.event.dateIso);
  let dbSkipped = false;
  const commitSha = await commitFilesAtomically(
    token,
    async () => {
      const attempt = await buildCommitFiles(fetchFn, token, input, paths);

      dbSkipped = attempt.dbSkipped;

      return attempt.files;
    },
    `${COMMIT_MESSAGE_PREFIX}${input.event.dateIso}`,
    fetchFn,
  );

  await publishVersionPointer(token, input.event.dateIso, commitSha, fetchFn);

  const result: PublishEventResult = { commitSha };

  if (dbSkipped) {
    result.dbSkipped = true;
  }

  return result;
}

/** Re-reads `index.json`/`athletes.json`/`protocol.db` and rebuilds all five files; invoked once per commit attempt. */
async function buildCommitFiles(
  fetchFn: GithubFetchFn,
  token: string,
  input: PublishEventInput,
  paths: EventFilePaths,
): Promise<PublishCommitAttempt> {
  const [indexText, historyText] = await Promise.all([
    fetchRepoFileText(token, INDEX_JSON_PATH, fetchFn),
    fetchRepoFileText(token, ATHLETES_JSON_PATH, fetchFn),
  ]);
  const { event, rows } = input;
  const slug = event.dateIso;
  const previousHistory = removeEventFromHistory(parseAthletesHistory(historyText), slug);
  const history = applyEventToHistory(previousHistory, { slug, dateIso: event.dateIso }, toEventResults(rows));
  const index = upsertIndexEntry(parseArchiveIndex(indexText), buildIndexEntry(event, rows));
  const resultsFile = buildEventResultsFile(event, rows);
  const dbFile = await buildProtocolDbCommitFile(
    token,
    (dbBytes) => applyEventToDb(dbBytes, { indexFile: index, history, resultsFile }),
    fetchFn,
  );
  const files: CommitFile[] = [
    { path: paths.sourceXlsx, base64Content: bytesToBase64(input.sourceXlsxBytes) },
    { path: paths.resultsJson, base64Content: jsonToBase64(resultsFile) },
    { path: INDEX_JSON_PATH, base64Content: jsonToBase64(index) },
    { path: ATHLETES_JSON_PATH, base64Content: jsonToBase64(history) },
  ];

  if (dbFile !== null) {
    files.push(dbFile);
  }

  return { files, dbSkipped: dbFile === null };
}

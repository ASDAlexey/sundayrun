import { removeEventFromHistory } from '../history/athletes-rollup';
import { removeEventFromDb } from '../sqlite/protocol-db-write';
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
import { buildProtocolDbCommitFile } from './protocol-db-file';
import { ATHLETES_JSON_PATH, INDEX_JSON_PATH } from './protocols-repo.constant';
import { fetchRepoFileText } from './repo-contents';
import { publishVersionPointer } from './version-pointer';

/**
 * The mirror of `publishEvent`: removes one published event from the protocols repository as a
 * single atomic commit — the two per-event files are deleted while `index.json`,
 * `athletes.json` and the derived `protocol.db` are rewritten without the event's entry,
 * rollup contribution and results rows. When the db rebuild fails the deletion still goes
 * through without it — the json files remain the source of truth and the next successful
 * publication converges the db again. The commit files are rebuilt from fresh repository reads
 * on every retry, so a concurrent publication is merged instead of overwritten. Finishes by
 * pointing `version.json` at the new commit — the sha-pinned data urls are immutable, so
 * nothing else needs a purge. Returns the deletion commit sha, so the session can pin its
 * reads to it.
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

/** Re-reads `index.json`/`athletes.json`/`protocol.db` and rebuilds all five commit entries; invoked once per commit attempt. */
async function buildCommitFiles(fetchFn: GithubFetchFn, token: string, slug: string, paths: EventFilePaths): Promise<CommitFile[]> {
  const [indexText, historyText] = await Promise.all([
    fetchRepoFileText(token, INDEX_JSON_PATH, fetchFn),
    fetchRepoFileText(token, ATHLETES_JSON_PATH, fetchFn),
  ]);
  const index = removeIndexEntry(parseArchiveIndex(indexText), slug);
  const history = removeEventFromHistory(parseAthletesHistory(historyText), slug);
  const dbFile = await buildProtocolDbCommitFile(
    token,
    (dbBytes) => removeEventFromDb(dbBytes, { indexFile: index, history, slug }),
    fetchFn,
  );
  const files: CommitFile[] = [
    { path: paths.sourceXlsx, base64Content: null },
    { path: paths.resultsJson, base64Content: null },
    { path: INDEX_JSON_PATH, base64Content: jsonToBase64(index) },
    { path: ATHLETES_JSON_PATH, base64Content: jsonToBase64(history) },
  ];

  if (dbFile !== null) {
    files.push(dbFile);
  }

  return files;
}

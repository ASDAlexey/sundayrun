import { bytesToBase64 } from '../encoding/base64';
import { applyEventToDb } from '../sqlite/protocol-db-write';
import { eventFilePaths } from './event-paths';
import { EventFilePaths } from './event-paths.interface';
import { COMMIT_MESSAGE_PREFIX } from './github-api.constant';
import { CommitFile } from './github-api.interface';
import { commitFilesAtomically } from './github-commit';
import { DEFAULT_GITHUB_FETCH } from './github-fetch.constant';
import { GithubFetchFn } from './github-fetch.type';
import { buildProtocolDbCommitFile } from './protocol-db-file';
import { PublishEventInput, PublishEventResult } from './publish-event.interface';
import { publishVersionPointer } from './version-pointer';

/**
 * Publishes one event into the protocols repository as a single atomic commit: the `source.xlsx`
 * workbook and the derived `sundayrun.db`, which is the single source of truth. The db is downloaded
 * fresh on every commit attempt and the event is rolled onto it — re-publishing the same date first
 * strips the previous contribution, so the operation is idempotent, and a concurrent publication is
 * merged instead of overwritten. Finishes by pointing `version.json` at the new commit — the
 * sha-pinned data urls are immutable, so nothing else needs a purge. The returned sha references the
 * data commit; the protocol PDF is generated on the fly from the results, never stored.
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

  await publishVersionPointer(token, input.event.dateIso, commitSha, fetchFn);

  return { commitSha };
}

/** Re-downloads `sundayrun.db`, rolls the event onto it and pairs it with the source workbook; once per attempt. */
async function buildCommitFiles(
  fetchFn: GithubFetchFn,
  token: string,
  input: PublishEventInput,
  paths: EventFilePaths,
): Promise<CommitFile[]> {
  const dbFile = await buildProtocolDbCommitFile(
    token,
    (dbBytes) => applyEventToDb(dbBytes, { event: input.event, rows: input.rows }),
    fetchFn,
  );

  return [{ path: paths.sourceXlsx, base64Content: bytesToBase64(input.sourceXlsxBytes) }, dbFile];
}

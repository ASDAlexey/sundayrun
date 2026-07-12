import { bytesToBase64 } from '../encoding/base64';
import { CommitFile } from './github-api.interface';
import { GithubFetchFn } from './github-fetch.type';
import { ProtocolDbUpdateFn } from './protocol-db-file.type';
import { PROTOCOL_DB_PATH } from './protocols-repo.constant';
import { fetchRepoFileBytes } from './repo-contents';

/**
 * Builds the `data/sundayrun.db` entry of a publication commit: downloads the current db via the
 * Contents API — fresh on every commit attempt, so a retry after a concurrent publication rebuilds
 * on top of that publication's results — and lets `updateDb` (SQLite wasm) converge it onto the new
 * state. `sundayrun.db` is the single source of truth now, so a download or wasm failure is not
 * swallowed: it propagates and fails the publication instead of committing stale data.
 */
export async function buildProtocolDbCommitFile(token: string, updateDb: ProtocolDbUpdateFn, fetchFn: GithubFetchFn): Promise<CommitFile> {
  const currentBytes = await fetchRepoFileBytes(token, PROTOCOL_DB_PATH, fetchFn);

  return { path: PROTOCOL_DB_PATH, base64Content: bytesToBase64(await updateDb(currentBytes)) };
}

import { bytesToBase64 } from '../encoding/base64';
import { type CommitFile } from './github-api.interface';
import { type GithubAccess } from './github-fetch.type';
import { type ProtocolDbUpdateFn } from './protocol-db-file.type';
import { PROTOCOL_DB_PATH } from './protocols-repo.constant';
import { fetchRepoFileBytes } from './repo-contents';

/** How this attempt rebuilds the db: the converge step, and the commit sha it reads the bytes at. */
export interface ProtocolDbRebuild {
  readonly updateDb: ProtocolDbUpdateFn;
  readonly parentSha: string;
}

/**
 * Builds the `data/sundayrun.db` entry of a publication commit: downloads the db via the Contents
 * API — fresh on every commit attempt, so a retry after a concurrent publication rebuilds on top of
 * that publication's results — and lets `updateDb` (SQLite wasm) converge it onto the new state.
 * `sundayrun.db` is the single source of truth now, so a download or wasm failure is not swallowed:
 * it propagates and fails the publication instead of committing stale data.
 *
 * `parentSha` is what makes "fresh" precise. Read at the branch tip, the bytes are a snapshot of
 * whenever the request happened to be served; read at the sha the commit will declare as its parent,
 * they are exactly the state the new tree claims to descend from.
 */
export async function buildProtocolDbCommitFile(access: GithubAccess, rebuild: ProtocolDbRebuild): Promise<CommitFile> {
  const { updateDb, parentSha } = rebuild;
  const currentBytes = await fetchRepoFileBytes(PROTOCOL_DB_PATH, { ...access, ref: parentSha });

  return { path: PROTOCOL_DB_PATH, base64Content: bytesToBase64(await updateDb(currentBytes)) };
}

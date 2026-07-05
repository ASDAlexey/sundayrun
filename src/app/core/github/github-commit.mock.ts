import { GIT_TREE_BLOB_TYPE, GIT_TREE_FILE_MODE } from './github-api.constant';
import { CommitFile } from './github-api.interface';
import { GitDataShas } from './spec-utils/git-data-routes';

export const COMMIT_TOKEN = 'commit-token';

export const COMMIT_MESSAGE = 'Публикация протокола: 2026-06-28';

export const OK_STATUS = 200;

export const HTTP_NOT_IMPLEMENTED = 501;

export const GIT_DATA_SHAS: GitDataShas = {
  headSha: 'head-sha',
  baseTreeSha: 'base-tree-sha',
  blobShaPrefix: 'blob-sha-',
  treeSha: 'tree-sha',
  newCommitSha: 'new-commit-sha',
};

/** Two uploads plus one deletion (`base64Content: null`), so a single cycle covers both tree entry kinds. */
export const COMMIT_FILES: CommitFile[] = [
  { path: 'data/events/2026-06-28/source.xlsx', base64Content: btoa('xlsx') },
  { path: 'data/index.json', base64Content: btoa('{}') },
  { path: 'data/events/2026-06-21/protocol.pdf', base64Content: null },
];

/** Only the uploads become blobs; the deletion never reaches the blobs endpoint. */
export const EXPECTED_BLOB_BODIES = COMMIT_FILES.filter((file) => file.base64Content !== null).map((file) => ({
  content: file.base64Content,
  encoding: 'base64',
}));

export const EXPECTED_TREE_BODY = {
  base_tree: GIT_DATA_SHAS.baseTreeSha,
  tree: COMMIT_FILES.map((file, index) => ({
    path: file.path,
    mode: GIT_TREE_FILE_MODE,
    type: GIT_TREE_BLOB_TYPE,
    sha: file.base64Content === null ? null : `${GIT_DATA_SHAS.blobShaPrefix}${index}`,
  })),
};

export const EXPECTED_COMMIT_BODY = {
  message: COMMIT_MESSAGE,
  tree: GIT_DATA_SHAS.treeSha,
  parents: [GIT_DATA_SHAS.headSha],
};

export const EXPECTED_REF_UPDATE_BODY = { sha: GIT_DATA_SHAS.newCommitSha };

import { GitDataShas } from './spec-utils/git-data-routes';

export const SITE_META_TOKEN = 'site-meta-token';

export const SITE_META_SHAS: GitDataShas = {
  headSha: 'meta-head-sha',
  baseTreeSha: 'meta-base-tree-sha',
  blobShaPrefix: 'meta-blob-sha-',
  treeSha: 'meta-tree-sha',
  newCommitSha: 'meta-commit-sha',
};

export const EXPECTED_SITE_META_PURGE_URL = 'https://purge.jsdelivr.net/gh/ASDAlexey/sundayrun@main/data/site-meta.json';

import { FIVE_KM_DISTANCE_KM } from '../history/distance.constant';
import { AthletesHistory } from '../models/athletes-history.type';
import { Gender } from '../models/gender.enum';
import { ARCHIVE_INDEX_SCHEMA_VERSION } from './archive-index.constant';
import { ArchiveIndexFile } from './archive-index.interface';
import { NEWER_ENTRY, OLDER_ENTRY } from './archive-index.mock';
import { EXPECTED_EVENT_PATHS } from './event-paths.mock';
import { GIT_TREE_BLOB_TYPE, GIT_TREE_FILE_MODE } from './github-api.constant';
import { GitTreeEntry } from './github-api.interface';
import { ATHLETES_JSON_PATH, INDEX_JSON_PATH, PROTOCOL_DB_PATH } from './protocols-repo.constant';
import { GitDataShas } from './spec-utils/git-data-routes';

export const DELETE_TOKEN = 'delete-token';

/** Matches `STALE_SAME_SLUG_ENTRY` inside `STALE_INDEX` and Мария's second run in `EXISTING_HISTORY`. */
export const DELETE_SLUG = '2026-06-28';

export const DELETE_SHAS: GitDataShas = {
  headSha: 'delete-head-sha',
  baseTreeSha: 'delete-base-tree-sha',
  blobShaPrefix: 'delete-blob-sha-',
  treeSha: 'delete-tree-sha',
  newCommitSha: 'delete-commit-sha',
};

export const EXPECTED_DELETE_COMMIT_MESSAGE = `Удаление протокола: ${DELETE_SLUG}`;

/** Three deletions (`sha: null`) followed by the two rewritten summaries; the db rebuild was skipped. */
export const EXPECTED_DELETE_TREE_ENTRIES_WITHOUT_DB: GitTreeEntry[] = [
  { path: EXPECTED_EVENT_PATHS.sourceXlsx, mode: GIT_TREE_FILE_MODE, type: GIT_TREE_BLOB_TYPE, sha: null },
  { path: EXPECTED_EVENT_PATHS.protocolPdf, mode: GIT_TREE_FILE_MODE, type: GIT_TREE_BLOB_TYPE, sha: null },
  { path: EXPECTED_EVENT_PATHS.resultsJson, mode: GIT_TREE_FILE_MODE, type: GIT_TREE_BLOB_TYPE, sha: null },
  { path: INDEX_JSON_PATH, mode: GIT_TREE_FILE_MODE, type: GIT_TREE_BLOB_TYPE, sha: `${DELETE_SHAS.blobShaPrefix}0` },
  { path: ATHLETES_JSON_PATH, mode: GIT_TREE_FILE_MODE, type: GIT_TREE_BLOB_TYPE, sha: `${DELETE_SHAS.blobShaPrefix}1` },
];

/** The full deletion tree: the rewritten (never deleted) derived db follows the summaries in blob-upload order. */
export const EXPECTED_DELETE_TREE_ENTRIES: GitTreeEntry[] = [
  ...EXPECTED_DELETE_TREE_ENTRIES_WITHOUT_DB,
  { path: PROTOCOL_DB_PATH, mode: GIT_TREE_FILE_MODE, type: GIT_TREE_BLOB_TYPE, sha: `${DELETE_SHAS.blobShaPrefix}2` },
];

/** `STALE_INDEX` without the deleted slug; parsing re-sorts the remaining entries newest first. */
export const EXPECTED_DELETED_INDEX: ArchiveIndexFile = {
  schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION,
  events: [NEWER_ENTRY, OLDER_ENTRY],
};

/** `EXISTING_HISTORY` without the deleted event: Мария keeps her older run, the bests are recomputed. */
export const EXPECTED_DELETED_HISTORY: AthletesHistory = {
  'мария иванова': {
    key: 'мария иванова',
    displayName: 'Мария Иванова',
    gender: Gender.female,
    participationSlugs: ['2026-06-21'],
    runs: [{ dateIso: '2026-06-21', slug: '2026-06-21', timeMs: 1560000, distanceKm: FIVE_KM_DISTANCE_KM }],
    bestMs: 1560000,
    bestMsByYear: { '2026': 1560000 },
  },
};

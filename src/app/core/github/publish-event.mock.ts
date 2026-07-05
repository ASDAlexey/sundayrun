import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from '../history/distance.constant';
import { AthletesHistory } from '../models/athletes-history.type';
import { Gender } from '../models/gender.enum';
import { ARCHIVE_INDEX_SCHEMA_VERSION } from './archive-index.constant';
import { ArchiveIndexEntry, ArchiveIndexFile } from './archive-index.interface';
import { EXPECTED_NEW_ENTRY, EXPECTED_UPSERTED_EVENTS, NEWER_ENTRY, OLDER_ENTRY, STALE_INDEX } from './archive-index.mock';
import { PublishEventInput } from './publish-event.interface';
import { GitDataShas } from './spec-utils/git-data-routes';
import { PROTOCOL_ROWS, RACE_EVENT } from './spec-utils/race-fixtures';

export const PUBLISH_TOKEN = 'publish-token';

export const SOURCE_XLSX_BYTES = new Uint8Array([1, 2, 3]);

export const PDF_BYTES = new Uint8Array([9, 8, 7, 6]);

export const PUBLISH_INPUT: PublishEventInput = {
  event: RACE_EVENT,
  rows: PROTOCOL_ROWS,
  sourceXlsxBytes: SOURCE_XLSX_BYTES,
  pdfBytes: PDF_BYTES,
};

export const PUBLISH_SHAS: GitDataShas = {
  headSha: 'publish-head-sha',
  baseTreeSha: 'publish-base-tree-sha',
  blobShaPrefix: 'publish-blob-sha-',
  treeSha: 'publish-tree-sha',
  newCommitSha: 'publish-commit-sha',
};

/** Pinned to the commit sha, not to the branch. */
export const EXPECTED_PDF_URL = `https://cdn.jsdelivr.net/gh/ASDAlexey/sundayrun@${PUBLISH_SHAS.newCommitSha}/data/events/2026-06-28/protocol.pdf`;

export const EXPECTED_COMMIT_PATHS = [
  'data/events/2026-06-28/source.xlsx',
  'data/events/2026-06-28/protocol.pdf',
  'data/events/2026-06-28/results.json',
  'data/index.json',
  'data/athletes.json',
];

export const EXPECTED_PURGE_URLS = EXPECTED_COMMIT_PATHS.map((path) => `https://purge.jsdelivr.net/gh/ASDAlexey/sundayrun@main/${path}`);

export const EXPECTED_COMMIT_MESSAGE = 'Публикация протокола: 2026-06-28';

export const EXISTING_INDEX_TEXT = JSON.stringify(STALE_INDEX);

export const EXPECTED_PUBLISHED_INDEX: ArchiveIndexFile = {
  schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION,
  events: EXPECTED_UPSERTED_EVENTS,
};

export const EXPECTED_FIRST_PUBLISH_INDEX: ArchiveIndexFile = {
  schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION,
  events: [EXPECTED_NEW_ENTRY],
};

/** Written by a competing publication between our first and second commit attempts. */
export const CONCURRENT_ENTRY: ArchiveIndexEntry = {
  slug: '2026-07-12',
  dateIso: '2026-07-12',
  number: 14,
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 25,
  finisherCount: 21,
  avgTimeMs: 1799000,
  bestMaleMs: 1102000,
  bestFemaleMs: 1305000,
  files: {
    sourceXlsx: 'data/events/2026-07-12/source.xlsx',
    protocolPdf: 'data/events/2026-07-12/protocol.pdf',
    resultsJson: 'data/events/2026-07-12/results.json',
  },
};

/** The index as the retry sees it: the stale index plus the concurrent publication. */
export const CONCURRENT_INDEX_TEXT = JSON.stringify({ ...STALE_INDEX, events: [CONCURRENT_ENTRY, ...STALE_INDEX.events] });

/** The retry rebuilds from the fresh index, so the concurrent entry survives next to ours. */
export const EXPECTED_MERGED_INDEX: ArchiveIndexFile = {
  schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION,
  events: [CONCURRENT_ENTRY, NEWER_ENTRY, EXPECTED_NEW_ENTRY, OLDER_ENTRY],
};

const MARIA_KEY = 'мария иванова';

const MARIA_BASE = { key: MARIA_KEY, displayName: 'Мария Иванова', gender: Gender.female };

const MARIA_OLDER_RUN = { dateIso: '2026-06-21', slug: '2026-06-21', timeMs: 1560000, distanceKm: FIVE_KM_DISTANCE_KM };

const MARIA_STALE_RUN = { dateIso: '2026-06-28', slug: '2026-06-28', timeMs: 1620000, distanceKm: FIVE_KM_DISTANCE_KM };

const MARIA_NEW_RUN = { dateIso: '2026-06-28', slug: '2026-06-28', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM };

/** Мария already has an older run plus a stale run of the re-published event (slug 2026-06-28). */
export const EXISTING_HISTORY: AthletesHistory = {
  [MARIA_KEY]: {
    ...MARIA_BASE,
    participationSlugs: ['2026-06-21', '2026-06-28'],
    runs: [MARIA_OLDER_RUN, MARIA_STALE_RUN],
    bestMs: 1560000,
    bestMsByYear: { '2026': 1560000 },
  },
};

export const EXISTING_HISTORY_TEXT = JSON.stringify(EXISTING_HISTORY);

/** The stale 2026-06-28 run is replaced, the 2.3 km run never counts towards bests, DNF keeps a run-less record. */
export const EXPECTED_PUBLISHED_HISTORY: AthletesHistory = {
  [MARIA_KEY]: {
    ...MARIA_BASE,
    participationSlugs: ['2026-06-21', '2026-06-28'],
    runs: [MARIA_OLDER_RUN, MARIA_NEW_RUN],
    bestMs: 1500000,
    bestMsByYear: { '2026': 1500000 },
  },
  'олег петров': {
    key: 'олег петров',
    displayName: 'Олег Петров',
    gender: Gender.male,
    participationSlugs: ['2026-06-28'],
    runs: [{ dateIso: '2026-06-28', slug: '2026-06-28', timeMs: 900000, distanceKm: TWO_THREE_KM_DISTANCE_KM }],
    bestMs: null,
    bestMsByYear: {},
  },
  'петр сидоров': {
    key: 'петр сидоров',
    displayName: 'Пётр Сидоров',
    gender: null,
    participationSlugs: ['2026-06-28'],
    runs: [],
    bestMs: null,
    bestMsByYear: {},
  },
};

export const EXPECTED_FIRST_PUBLISH_HISTORY: AthletesHistory = {
  ...EXPECTED_PUBLISHED_HISTORY,
  [MARIA_KEY]: {
    ...MARIA_BASE,
    participationSlugs: ['2026-06-28'],
    runs: [MARIA_NEW_RUN],
    bestMs: 1500000,
    bestMsByYear: { '2026': 1500000 },
  },
};

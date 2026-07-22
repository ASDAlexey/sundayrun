import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from '../history/distance.constant';
import { AthletesHistory } from '../models/athletes-history.type';
import { Gender } from '../models/gender.enum';
import { PROTOCOL_DB_PATH } from './protocols-repo.constant';
import { PublishEventInput } from './publish-event.interface';
import { GitDataShas } from './spec-utils/git-data-routes';
import { PROTOCOL_ROWS, RACE_EVENT } from './spec-utils/race-fixtures';
import { VERSION_COMMIT_MESSAGE_PREFIX } from './version-pointer.constant';

export const PUBLISH_TOKEN = 'publish-token';

export const SOURCE_XLSX_BYTES = new Uint8Array([1, 2, 3]);

export const PUBLISH_INPUT: PublishEventInput = {
  event: RACE_EVENT,
  rows: PROTOCOL_ROWS,
  sourceXlsxBytes: SOURCE_XLSX_BYTES,
};

export const PUBLISH_SHAS: GitDataShas = {
  headSha: 'publish-head-sha',
  baseTreeSha: 'publish-base-tree-sha',
  blobShaPrefix: 'publish-blob-sha-',
  treeSha: 'publish-tree-sha',
  newCommitSha: 'publish-commit-sha',
};

/** A publication commits only the source workbook and the single-source-of-truth db. */
export const EXPECTED_COMMIT_PATHS = ['data/events/2026-06-28/source.xlsx', PROTOCOL_DB_PATH];

export const EXPECTED_COMMIT_MESSAGE = 'Публикация протокола: 2026-06-28';

/** The second batch workbook's bytes, distinct from `SOURCE_XLSX_BYTES` so the upload order is assertable. */
export const EARLIER_SOURCE_XLSX_BYTES = new Uint8Array([4, 5, 6]);

/** A second protocol one week before `RACE_EVENT`'s date, so the batch below arrives out of date order. */
export const EARLIER_EVENT_DATE_ISO = '2026-06-21';

export const EARLIER_PUBLISH_INPUT: PublishEventInput = {
  event: { ...RACE_EVENT, dateIso: EARLIER_EVENT_DATE_ISO },
  rows: PROTOCOL_ROWS,
  sourceXlsxBytes: EARLIER_SOURCE_XLSX_BYTES,
};

/** Given newest first, so `publishEvents` must sort before slugging and committing. */
export const BATCH_PUBLISH_INPUTS: PublishEventInput[] = [PUBLISH_INPUT, EARLIER_PUBLISH_INPUT];

/** A batch commits every workbook date-ordered plus the ONE db carrying all the events. */
export const EXPECTED_BATCH_COMMIT_PATHS = ['data/events/2026-06-21/source.xlsx', 'data/events/2026-06-28/source.xlsx', PROTOCOL_DB_PATH];

/** The two-input batch slug: the sorted date range plus the count. */
const EXPECTED_BATCH_SLUG = '2026-06-21..2026-06-28 (2)';

export const EXPECTED_BATCH_COMMIT_MESSAGE = `Публикация протокола: ${EXPECTED_BATCH_SLUG}`;

/** The single pointer mini-commit of a batch reuses the same range slug. */
export const EXPECTED_BATCH_VERSION_COMMIT_MESSAGE = `${VERSION_COMMIT_MESSAGE_PREFIX}${EXPECTED_BATCH_SLUG}`;

/** The opening of the drizzle-compiled `events` insert, locating the batch's archive write in the fake db. */
export const EVENTS_INSERT_SQL_PREFIX = 'insert into "events"';

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

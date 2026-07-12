import {
  BEARER_PREFIX,
  CONTENTS_REF_QUERY,
  GITHUB_API_VERSION,
  GITHUB_API_VERSION_HEADER,
  GITHUB_RAW_ACCEPT,
  REPO_CONTENTS_URL,
} from '../core/github/github-api.constant';
import { PROTOCOL_DB_PATH } from '../core/github/protocols-repo.constant';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from '../core/history/distance.constant';
import { AthletesHistory } from '../core/models/athletes-history.type';
import { Gender } from '../core/models/gender.enum';
import { ADMIN_TOKEN_MOCK } from './admin-token.service.mock';

/** The Contents API url `loadHistory` must hit for `data/protocol.db`. */
export const EXPECTED_DB_URL = `${REPO_CONTENTS_URL}${PROTOCOL_DB_PATH}${CONTENTS_REF_QUERY}`;

/** Raw-accept init carrying the stored organiser token. */
export const EXPECTED_HISTORY_INIT = {
  headers: {
    Accept: GITHUB_RAW_ACCEPT,
    Authorization: `${BEARER_PREFIX}${ADMIN_TOKEN_MOCK}`,
    [GITHUB_API_VERSION_HEADER]: GITHUB_API_VERSION,
  },
};

const ATHLETE_KEY = 'иван петров';

const q = (value: string): string => `'${value}'`;

/**
 * One athlete whose runs span the season best (the fastest), a slower same-year run and a 2.3 km run
 * that never counts — so the reassembled `bestMsByYear` exercises every path.
 */
const RUNS = [
  { dateIso: '2026-06-07', slug: '2026-06-07', timeMs: 1600000, distanceKm: FIVE_KM_DISTANCE_KM },
  { dateIso: '2026-06-14', slug: '2026-06-14', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
  { dateIso: '2026-06-21', slug: '2026-06-21', timeMs: 1550000, distanceKm: FIVE_KM_DISTANCE_KM },
  { dateIso: '2026-06-28', slug: '2026-06-28', timeMs: 900000, distanceKm: TWO_THREE_KM_DISTANCE_KM },
];

/** The seed SQL for one athlete's three tables; exported to bytes it is the `protocol.db` the service reads. */
export const HISTORY_DB_SEED: readonly string[] = [
  `INSERT INTO athletes VALUES (${q(ATHLETE_KEY)}, ${q('Иван Петров')}, ${q(Gender.male)}, 1500000)`,
  ...RUNS.map((run) => `INSERT INTO runs VALUES (${q(ATHLETE_KEY)}, ${q(run.dateIso)}, ${q(run.slug)}, ${run.timeMs}, ${run.distanceKm})`),
  ...RUNS.map((run) => `INSERT INTO participations VALUES (${q(ATHLETE_KEY)}, ${q(run.slug)})`),
];

/** The history reassembled from `HISTORY_DB_SEED`, with `bestMsByYear` recomputed from the 5 km runs. */
export const EXPECTED_HISTORY: AthletesHistory = {
  [ATHLETE_KEY]: {
    key: ATHLETE_KEY,
    displayName: 'Иван Петров',
    gender: Gender.male,
    participationSlugs: RUNS.map((run) => run.slug),
    runs: RUNS,
    bestMs: 1500000,
    bestMsByYear: { '2026': 1500000 },
  },
};

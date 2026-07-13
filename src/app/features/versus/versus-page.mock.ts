import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { AthleteRecord, AthleteRun } from '../../core/models/athlete-history.interface';
import { SelfAthlete } from '../../state/self-athlete.interface';
import { ATHLETES_PAGE_LINK } from '../../app.constant';
import { NO_BEST_TIME_TEXT } from '../athlete/athlete-page.constant';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { DRAW_GAP_TEXT } from './versus-page.constant';
import { DuelSideView, AthleteOptionView, MeetingView } from './versus-page.interface';

/** Denormalized on purpose: resolves to `LEFT_KEY` only after key normalization. */
export const LEFT_KEY_PARAM = ' ПЕТРОВ ПЁТР ';

export const LEFT_KEY = 'петров петр';

export const RIGHT_KEY = 'сидорова анна';

/** A directory-only athlete sharing the `петр` fragment with `LEFT_KEY`, for the exclusion check. */
export const SUGGESTED_KEY = 'петрова мария';

/** Another `петр` namesake, without a finished 5 km run — sorts before Мария in the dropdown. */
export const TIMELESS_KEY = 'петренко ольга';

export const UNKNOWN_KEY = 'неизвестный атлет';

export const VERSUS_LOAD_ERROR_MESSAGE = 'versus history load failed';

/** Normalizes to `петрова`: matches the directory-only athlete alone. */
export const SUGGESTION_QUERY = ' ПЕТРОВА ';

/** Normalizes to `петр`: matches all three namesakes, but the picked one must not suggest itself. */
export const SHARED_PREFIX_QUERY = 'Пётр';

const run = (slug: string, dateIso: string, timeMs: number): AthleteRun => ({ dateIso, slug, timeMs, distanceKm: FIVE_KM_DISTANCE_KM });

const record = (key: string, displayName: string, bestMs: number | null, runs: AthleteRun[]): AthleteRecord => ({
  key,
  displayName,
  gender: null,
  participationSlugs: [],
  runs,
  bestMs,
  bestMsByYear: {},
});

/** Пётр and Анна met on kuzminki-2 (he was ahead), kuzminki-3 (she was) and kuzminki-4 (a draw); kuzminki-1 he ran alone. */
export const VERSUS_RECORDS: Record<string, AthleteRecord> = {
  [LEFT_KEY]: record(LEFT_KEY, 'Петров Пётр', 1440000, [
    run('kuzminki-1', '2025-12-27', 1500000),
    run('kuzminki-2', '2026-01-03', 1440000),
    run('kuzminki-3', '2026-01-10', 1500000),
    run('kuzminki-4', '2026-01-17', 1500000),
  ]),
  [RIGHT_KEY]: record(RIGHT_KEY, 'Сидорова Анна', 1440000, [
    run('kuzminki-2', '2026-01-03', 1500000),
    run('kuzminki-3', '2026-01-10', 1440000),
    run('kuzminki-4', '2026-01-17', 1500000),
  ]),
};

const SUGGESTED_RECORD: AthleteRecord = record(SUGGESTED_KEY, 'Петрова Мария', 1620000, []);

const TIMELESS_RECORD: AthleteRecord = record(TIMELESS_KEY, 'Петренко Ольга', null, []);

/** The picker directory: both duelists plus the suggestion-only namesakes. */
export const DIRECTORY_RECORDS: AthleteRecord[] = [VERSUS_RECORDS[LEFT_KEY], VERSUS_RECORDS[RIGHT_KEY], SUGGESTED_RECORD, TIMELESS_RECORD];

export const EXPECTED_LEFT_SIDE: DuelSideView = {
  key: LEFT_KEY,
  displayName: 'Петров Пётр',
  athleteLink: [ATHLETES_PAGE_LINK, LEFT_KEY],
  wins: 1,
};

export const EXPECTED_RIGHT_SIDE: DuelSideView = {
  key: RIGHT_KEY,
  displayName: 'Сидорова Анна',
  athleteLink: [ATHLETES_PAGE_LINK, RIGHT_KEY],
  wins: 1,
};

export const EXPECTED_DRAW_COUNT = 1;

/** The three meetings newest-first: the draw, then each side winning once with the same one-minute gap. */
export const EXPECTED_MEETING_VIEWS: MeetingView[] = [
  {
    slug: 'kuzminki-4',
    raceLink: [RACE_PAGE_BASE_LINK, 'kuzminki-4'],
    dateShort: '17.01.2026 г.',
    leftTimeText: '25:00',
    rightTimeText: '25:00',
    leftWon: false,
    rightWon: false,
    gapText: DRAW_GAP_TEXT,
  },
  {
    slug: 'kuzminki-3',
    raceLink: [RACE_PAGE_BASE_LINK, 'kuzminki-3'],
    dateShort: '10.01.2026 г.',
    leftTimeText: '25:00',
    rightTimeText: '24:00',
    leftWon: false,
    rightWon: true,
    gapText: '1:00',
  },
  {
    slug: 'kuzminki-2',
    raceLink: [RACE_PAGE_BASE_LINK, 'kuzminki-2'],
    dateShort: '03.01.2026 г.',
    leftTimeText: '24:00',
    rightTimeText: '25:00',
    leftWon: true,
    rightWon: false,
    gapText: '1:00',
  },
];

/** The highlighted (winning) time of each decided meeting, newest first; the draw contributes none. */
export const EXPECTED_WINNING_TIMES: string[] = ['24:00', '24:00'];

export const EXPECTED_SUGGESTION_OPTION: AthleteOptionView = {
  key: SUGGESTED_KEY,
  displayName: 'Петрова Мария',
  bestTimeText: '27:00',
};

/** The `петр` matches with `LEFT_KEY` picked, sorted by display name; no best time renders a dash. */
export const EXPECTED_SHARED_PREFIX_OPTIONS: AthleteOptionView[] = [
  { key: TIMELESS_KEY, displayName: 'Петренко Ольга', bestTimeText: NO_BEST_TIME_TEXT },
  EXPECTED_SUGGESTION_OPTION,
];

/** The header pick («Выбери себя») that prefills the bare `/vs` with Пётр. */
export const VERSUS_SELF_PICK: SelfAthlete = { key: LEFT_KEY, displayName: 'Петров Пётр' };

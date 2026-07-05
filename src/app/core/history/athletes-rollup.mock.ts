import { Gender } from '../models/gender.enum';
import { AthleteRecord } from '../models/athlete-history.interface';
import { AthletesHistory } from '../models/athletes-history.type';
import { EventRef, EventResult } from './athletes-rollup.interface';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';

export const REPEAT_RUNNER_KEY = 'иванов иван';

export const DNF_ONLY_KEY = 'сошедший атлет';

/**
 * Three sequential events covering: key normalization (spaces, case, 'ё'), first-seen display name,
 * DNF creating an empty record, a 2.3 km run excluded from bests, gender kept/backfilled,
 * improving and worsening times within and across years.
 */
export const ROLLUP_EVENTS: readonly (readonly [EventRef, EventResult[]])[] = [
  [
    { slug: 'kuzminki-1', dateIso: '2025-12-27' },
    [
      { fullName: ' Иванов Иван ', gender: Gender.male, timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
      { fullName: 'Ёлкина Алёна', gender: Gender.female, timeMs: 1620000, distanceKm: FIVE_KM_DISTANCE_KM },
      { fullName: 'Новиков Олег', gender: null, timeMs: 690000, distanceKm: TWO_THREE_KM_DISTANCE_KM },
      { fullName: 'Сошедший Атлет', gender: Gender.male, timeMs: null, distanceKm: FIVE_KM_DISTANCE_KM },
    ],
  ],
  [
    { slug: 'kuzminki-2', dateIso: '2026-01-03' },
    [
      { fullName: 'ИВАНОВ ИВАН', gender: null, timeMs: 1440000, distanceKm: FIVE_KM_DISTANCE_KM },
      { fullName: 'Елкина Алена', gender: Gender.female, timeMs: 1680000, distanceKm: FIVE_KM_DISTANCE_KM },
      { fullName: 'Новиков Олег', gender: Gender.male, timeMs: 1400000, distanceKm: FIVE_KM_DISTANCE_KM },
    ],
  ],
  [
    { slug: 'kuzminki-3', dateIso: '2026-01-10' },
    [
      { fullName: 'Иванов Иван', gender: Gender.male, timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
      { fullName: 'Ёлкина Алёна', gender: Gender.female, timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
    ],
  ],
];

export const EXPECTED_ROLLUP_HISTORY: AthletesHistory = {
  'иванов иван': {
    key: 'иванов иван',
    displayName: 'Иванов Иван',
    gender: Gender.male,
    participationSlugs: ['kuzminki-1', 'kuzminki-2', 'kuzminki-3'],
    runs: [
      { dateIso: '2025-12-27', slug: 'kuzminki-1', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2026-01-03', slug: 'kuzminki-2', timeMs: 1440000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2026-01-10', slug: 'kuzminki-3', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
    ],
    bestMs: 1440000,
    bestMsByYear: { '2025': 1500000, '2026': 1440000 },
  },
  'елкина алена': {
    key: 'елкина алена',
    displayName: 'Ёлкина Алёна',
    gender: Gender.female,
    participationSlugs: ['kuzminki-1', 'kuzminki-2', 'kuzminki-3'],
    runs: [
      { dateIso: '2025-12-27', slug: 'kuzminki-1', timeMs: 1620000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2026-01-03', slug: 'kuzminki-2', timeMs: 1680000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2026-01-10', slug: 'kuzminki-3', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
    ],
    bestMs: 1500000,
    bestMsByYear: { '2025': 1620000, '2026': 1500000 },
  },
  'новиков олег': {
    key: 'новиков олег',
    displayName: 'Новиков Олег',
    gender: Gender.male,
    participationSlugs: ['kuzminki-1', 'kuzminki-2'],
    runs: [
      { dateIso: '2025-12-27', slug: 'kuzminki-1', timeMs: 690000, distanceKm: TWO_THREE_KM_DISTANCE_KM },
      { dateIso: '2026-01-03', slug: 'kuzminki-2', timeMs: 1400000, distanceKm: FIVE_KM_DISTANCE_KM },
    ],
    bestMs: 1400000,
    bestMsByYear: { '2026': 1400000 },
  },
  'сошедший атлет': {
    key: 'сошедший атлет',
    displayName: 'Сошедший Атлет',
    gender: Gender.male,
    participationSlugs: ['kuzminki-1'],
    runs: [],
    bestMs: null,
    bestMsByYear: {},
  },
};

export const REMOVED_SLUG = 'kuzminki-2';

export const MISSING_SLUG = 'kuzminki-99';

/** Loses their only participation when `REMOVED_SLUG` is deleted, so the whole record is dropped. */
export const SINGLE_RUN_KEY = 'быстрова яна';

const SECOND_RUNNER_KEY = 'елкина алена';

const SHORT_RUNNER_KEY = 'новиков олег';

/**
 * Removal input: the rolled-up history plus an athlete whose only run belongs to `REMOVED_SLUG`.
 * Covers: a run removed from the middle (bests recompute), a record left with a 2.3 km run only
 * (bests reset to null), a dropped single-run athlete and an untouched DNF-only record.
 */
export const REMOVAL_HISTORY: AthletesHistory = {
  ...EXPECTED_ROLLUP_HISTORY,
  [SINGLE_RUN_KEY]: {
    key: SINGLE_RUN_KEY,
    displayName: 'Быстрова Яна',
    gender: Gender.female,
    participationSlugs: [REMOVED_SLUG],
    runs: [{ dateIso: '2026-01-03', slug: REMOVED_SLUG, timeMs: 1300000, distanceKm: FIVE_KM_DISTANCE_KM }],
    bestMs: 1300000,
    bestMsByYear: { '2026': 1300000 },
  },
};

const REPEAT_RUNNER = EXPECTED_ROLLUP_HISTORY[REPEAT_RUNNER_KEY];

const SECOND_RUNNER = EXPECTED_ROLLUP_HISTORY[SECOND_RUNNER_KEY];

const SHORT_RUNNER = EXPECTED_ROLLUP_HISTORY[SHORT_RUNNER_KEY];

export const EXPECTED_REMOVAL_HISTORY: AthletesHistory = {
  [REPEAT_RUNNER_KEY]: {
    ...REPEAT_RUNNER,
    participationSlugs: ['kuzminki-1', 'kuzminki-3'],
    runs: [REPEAT_RUNNER.runs[0], REPEAT_RUNNER.runs[2]],
    bestMs: 1500000,
    bestMsByYear: { '2025': 1500000, '2026': 1500000 },
  },
  [SECOND_RUNNER_KEY]: {
    ...SECOND_RUNNER,
    participationSlugs: ['kuzminki-1', 'kuzminki-3'],
    runs: [SECOND_RUNNER.runs[0], SECOND_RUNNER.runs[2]],
    bestMs: 1500000,
    bestMsByYear: { '2025': 1620000, '2026': 1500000 },
  },
  [SHORT_RUNNER_KEY]: {
    ...SHORT_RUNNER,
    participationSlugs: ['kuzminki-1'],
    runs: [SHORT_RUNNER.runs[0]],
    bestMs: null,
    bestMsByYear: {},
  },
  [DNF_ONLY_KEY]: EXPECTED_ROLLUP_HISTORY[DNF_ONLY_KEY],
};

export const CUTOFF_DATE_ISO = '2026-06-14';

export const MIXED_DATES_KEY = 'смешанные даты';

/** Only the cutoff-date participation: the whole record disappears from the "before" view. */
export const CUTOFF_ONLY_KEY = 'сегодняшний атлет';

export const OLDER_ONLY_KEY = 'старый атлет';

const MIXED_OLDER_RUN = { dateIso: '2026-06-07', slug: '2026-06-07', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM };

/**
 * `historyBeforeDate` input: an athlete with runs before, at and after the cutoff (bests
 * recompute), an athlete with the cutoff date only (dropped) and an untouched older record.
 */
export const BEFORE_DATE_HISTORY: AthletesHistory = {
  [MIXED_DATES_KEY]: {
    key: MIXED_DATES_KEY,
    displayName: 'Смешанные Даты',
    gender: Gender.male,
    participationSlugs: ['2026-06-07', CUTOFF_DATE_ISO, '2026-06-21'],
    runs: [
      MIXED_OLDER_RUN,
      { dateIso: CUTOFF_DATE_ISO, slug: CUTOFF_DATE_ISO, timeMs: 1400000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2026-06-21', slug: '2026-06-21', timeMs: 1300000, distanceKm: FIVE_KM_DISTANCE_KM },
    ],
    bestMs: 1300000,
    bestMsByYear: { '2026': 1300000 },
  },
  [CUTOFF_ONLY_KEY]: {
    key: CUTOFF_ONLY_KEY,
    displayName: 'Сегодняшний Атлет',
    gender: Gender.female,
    participationSlugs: [CUTOFF_DATE_ISO],
    runs: [{ dateIso: CUTOFF_DATE_ISO, slug: CUTOFF_DATE_ISO, timeMs: 1200000, distanceKm: FIVE_KM_DISTANCE_KM }],
    bestMs: 1200000,
    bestMsByYear: { '2026': 1200000 },
  },
  [OLDER_ONLY_KEY]: {
    key: OLDER_ONLY_KEY,
    displayName: 'Старый Атлет',
    gender: Gender.male,
    participationSlugs: ['2026-06-07'],
    runs: [{ ...MIXED_OLDER_RUN, timeMs: 1560000 }],
    bestMs: 1560000,
    bestMsByYear: { '2026': 1560000 },
  },
};

export const EXPECTED_BEFORE_DATE_HISTORY: AthletesHistory = {
  [MIXED_DATES_KEY]: {
    ...BEFORE_DATE_HISTORY[MIXED_DATES_KEY],
    participationSlugs: ['2026-06-07'],
    runs: [MIXED_OLDER_RUN],
    bestMs: MIXED_OLDER_RUN.timeMs,
    bestMsByYear: { '2026': MIXED_OLDER_RUN.timeMs },
  },
  [OLDER_ONLY_KEY]: BEFORE_DATE_HISTORY[OLDER_ONLY_KEY],
};

export const DNF_REPUBLISH_EVENT: EventRef = { slug: 'kuzminki-9', dateIso: '2026-02-07' };

/** The DNF participant's surname as it was misspelled in the first publication. */
export const MISSPELLED_DNF_KEY = 'сошедшый атлет';

export const MISSPELLED_DNF_RESULTS: EventResult[] = [
  { fullName: 'Сошедшый Атлет', gender: Gender.male, timeMs: null, distanceKm: FIVE_KM_DISTANCE_KM },
];

export const CORRECTED_DNF_RESULTS: EventResult[] = [
  { fullName: 'Сошедший Атлет', gender: Gender.male, timeMs: null, distanceKm: FIVE_KM_DISTANCE_KM },
];

export const RUN_EVENT: EventRef = { slug: 'kuzminki-x', dateIso: '2026-03-01' };

export const DNF_EVENT: EventRef = { slug: 'kuzminki-y', dateIso: '2026-03-08' };

export const MIXED_ATHLETE_KEY = 'смешанный атлет';

/** The same athlete finishes `RUN_EVENT` and DNFs `DNF_EVENT`. */
export const MIXED_RUN_RESULTS: EventResult[] = [
  { fullName: 'Смешанный Атлет', gender: Gender.male, timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
];

export const MIXED_DNF_RESULTS: EventResult[] = [
  { fullName: 'Смешанный Атлет', gender: Gender.male, timeMs: null, distanceKm: FIVE_KM_DISTANCE_KM },
];

/** After re-publishing `RUN_EVENT`: the DNF participation of `DNF_EVENT` survives, the run is re-applied. */
export const EXPECTED_MIXED_RECORD: AthleteRecord = {
  key: MIXED_ATHLETE_KEY,
  displayName: 'Смешанный Атлет',
  gender: Gender.male,
  participationSlugs: [DNF_EVENT.slug, RUN_EVENT.slug],
  runs: [{ dateIso: RUN_EVENT.dateIso, slug: RUN_EVENT.slug, timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM }],
  bestMs: 1500000,
  bestMsByYear: { '2026': 1500000 },
};

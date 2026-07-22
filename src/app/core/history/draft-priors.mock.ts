import { ProtocolRow } from '../models/protocol-row.interface';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { DraftRows } from './draft-priors.interface';
import { PreviousBest } from './previous-bests.interface';

/**
 * Two earlier drafts on top of stored priors covering every branch: the veteran's stored count and
 * best meet both a slower and a faster draft run, the newcomer exists only in the drafts, the
 * short-course and DNF rows stay out, and the stored outsider passes through untouched.
 */

export const DRAFT_VETERAN_KEY = 'ветеран трассы';

export const DRAFT_NEWCOMER_KEY = 'новичок забега';

/** An athlete stored in the priors but absent from every draft; both maps must keep the entry as-is. */
const DRAFT_OUTSIDER_KEY = 'посторонний атлет';

export const FIRST_DRAFT_DATE = '2026-06-14';

export const SECOND_DRAFT_DATE = '2026-06-21';

const STORED_BEST_DATE = '2026-01-11';

const STORED_BEST_MS = 1500000;

/** Slower than the stored best, so the first draft never displaces it. */
const SLOWER_DRAFT_MS = 1560000;

/** Faster than the stored best, so the second draft replaces it. */
export const FASTER_DRAFT_MS = 1440000;

export const NEWCOMER_DRAFT_MS = 1600000;

const SHORT_COURSE_MS = 800000;

const row = (index: number, fullName: string, totalMs: number | null, distanceKm: number | null): ProtocolRow => ({
  index,
  fullName,
  time23: '',
  time5: '',
  totalMs,
  distanceKm,
  gender: null,
  placeM: null,
  placeF: null,
  club: '',
  note: '',
});

/** Oldest first, as `draftRowsBefore` returns them; the spellings ('Ё', double space) force the key normalization. */
export const EARLIER_DRAFTS: DraftRows[] = [
  {
    dateIso: FIRST_DRAFT_DATE,
    rows: [
      row(1, 'Ветеран  Трассы', SLOWER_DRAFT_MS, FIVE_KM_DISTANCE_KM),
      row(2, 'Новичок Забега', NEWCOMER_DRAFT_MS, FIVE_KM_DISTANCE_KM),
      row(3, 'На Круге', SHORT_COURSE_MS, TWO_THREE_KM_DISTANCE_KM),
      row(4, 'Сошёл Сдистанции', null, null),
    ],
  },
  { dateIso: SECOND_DRAFT_DATE, rows: [row(1, 'Ветеран Трассы', FASTER_DRAFT_MS, FIVE_KM_DISTANCE_KM)] },
];

export const PRIOR_DRAFT_FINISH_COUNTS: Record<string, number> = {
  [DRAFT_VETERAN_KEY]: 12,
  [DRAFT_OUTSIDER_KEY]: 7,
};

/** The veteran gains one finish per draft, the newcomer starts from nothing, the outsider stays stored. */
export const EXPECTED_DRAFT_FINISH_COUNTS: Record<string, number> = {
  [DRAFT_VETERAN_KEY]: 14,
  [DRAFT_NEWCOMER_KEY]: 1,
  [DRAFT_OUTSIDER_KEY]: 7,
};

export const PRIOR_DRAFT_PREVIOUS_BESTS: Record<string, PreviousBest> = {
  [DRAFT_VETERAN_KEY]: { slug: STORED_BEST_DATE, dateIso: STORED_BEST_DATE, timeMs: STORED_BEST_MS },
  [DRAFT_OUTSIDER_KEY]: { slug: STORED_BEST_DATE, dateIso: STORED_BEST_DATE, timeMs: STORED_BEST_MS },
};

/** The slower first draft keeps the stored best, the faster second draft replaces it, the newcomer enters. */
export const EXPECTED_DRAFT_PREVIOUS_BESTS: Record<string, PreviousBest> = {
  [DRAFT_VETERAN_KEY]: { slug: SECOND_DRAFT_DATE, dateIso: SECOND_DRAFT_DATE, timeMs: FASTER_DRAFT_MS },
  [DRAFT_NEWCOMER_KEY]: { slug: FIRST_DRAFT_DATE, dateIso: FIRST_DRAFT_DATE, timeMs: NEWCOMER_DRAFT_MS },
  [DRAFT_OUTSIDER_KEY]: { slug: STORED_BEST_DATE, dateIso: STORED_BEST_DATE, timeMs: STORED_BEST_MS },
};

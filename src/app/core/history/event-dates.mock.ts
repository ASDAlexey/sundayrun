import { Gender } from '../models/gender.enum';
import { AthletesHistory } from '../models/athletes-history.type';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';

/**
 * Two athletes with overlapping, unsorted participations: the shared 2026-01-11 slug must
 * deduplicate and the recovered dates must come out ascending. Мороз's DNF-only participation
 * (no runs) still marks its event as published.
 */
export const EVENT_DATES_HISTORY: AthletesHistory = {
  'иванов иван': {
    key: 'иванов иван',
    displayName: 'Иванов Иван',
    gender: Gender.male,
    participationSlugs: ['2026-01-11', '2026-01-04'],
    runs: [
      { dateIso: '2026-01-11', slug: '2026-01-11', timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
      { dateIso: '2026-01-04', slug: '2026-01-04', timeMs: 1560000, distanceKm: FIVE_KM_DISTANCE_KM },
    ],
    bestMs: 1500000,
    bestMsByYear: { '2026': 1500000 },
  },
  'мороз давид': {
    key: 'мороз давид',
    displayName: 'Мороз Давид',
    gender: null,
    participationSlugs: ['2026-01-18', '2026-01-11'],
    runs: [],
    bestMs: null,
    bestMsByYear: {},
  },
};

export const EXPECTED_EVENT_DATES: string[] = ['2026-01-04', '2026-01-11', '2026-01-18'];

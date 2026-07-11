import { FIVE_KM_DISTANCE_KM } from '../history/distance.constant';
import { AthletesHistory } from '../models/athletes-history.type';
import { Gender } from '../models/gender.enum';

export const VALID_HISTORY: AthletesHistory = {
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

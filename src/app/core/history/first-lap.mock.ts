import { Gender } from '../models/gender.enum';
import { AthleteFirstLap, FirstLapRun } from './first-lap.interface';
import { FirstLapRecords } from './first-lap.type';

/**
 * Splits covering every branch of the record scan: the opening men's record, a slower split that
 * never enters, an improvement, a later equal split (the first setter keeps the record) and an
 * independent women's board. Listed out of date order so no scan order is assumed.
 */
export const FIRST_LAP_RUNS: FirstLapRun[] = [
  { key: 'быстров борис', displayName: 'Быстров Борис', gender: Gender.male, dateIso: '2025-03-02', slug: '2025-03-02', lapMs: 480000 },
  {
    key: 'медленнов михаил',
    displayName: 'Медленнов Михаил',
    gender: Gender.male,
    dateIso: '2025-03-09',
    slug: '2025-03-09',
    lapMs: 540000,
  },
  { key: 'быстров борис', displayName: 'Быстров Борис', gender: Gender.male, dateIso: '2024-03-10', slug: '2024-03-10', lapMs: 500000 },
  // Equalling the record later never takes it over.
  { key: 'азбукин андрей', displayName: 'Азбукин Андрей', gender: Gender.male, dateIso: '2025-04-06', slug: '2025-04-06', lapMs: 480000 },
  { key: 'ланская лидия', displayName: 'Ланская Лидия', gender: Gender.female, dateIso: '2025-05-11', slug: '2025-05-11', lapMs: 600000 },
];

export const EXPECTED_FIRST_LAP_RECORDS: FirstLapRecords = {
  [Gender.male]: {
    key: 'быстров борис',
    displayName: 'Быстров Борис',
    gender: Gender.male,
    dateIso: '2025-03-02',
    slug: '2025-03-02',
    lapMs: 480000,
  },
  [Gender.female]: {
    key: 'ланская лидия',
    displayName: 'Ланская Лидия',
    gender: Gender.female,
    dateIso: '2025-05-11',
    slug: '2025-05-11',
    lapMs: 600000,
  },
};

/** One athlete's splits: an improvement, a later equal split and a slower one, out of date order. */
export const ATHLETE_FIRST_LAPS: AthleteFirstLap[] = [
  { dateIso: '2025-06-01', slug: '2025-06-01', lapMs: 510000 },
  { dateIso: '2025-05-04', slug: '2025-05-04', lapMs: 495000 },
  { dateIso: '2025-07-06', slug: '2025-07-06', lapMs: 495000 },
];

/** The earliest of the two equal 495000 splits. */
export const EXPECTED_BEST_FIRST_LAP: AthleteFirstLap = { dateIso: '2025-05-04', slug: '2025-05-04', lapMs: 495000 };

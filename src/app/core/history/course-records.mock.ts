import { Gender } from '../models/gender.enum';
import { CourseRecordRun } from './course-records.interface';
import { CourseRecordHistory } from './course-records.type';

/**
 * Unsorted runs covering every branch of the progression scan: the opening record, a slower run
 * that never enters, an improvement, two record-beating runs at one event (only the fastest
 * counts), a later run that merely equals the record (the holder keeps it), and an independent
 * women's history. Listed out of date order so the sort is exercised.
 */
export const COURSE_RECORD_RUNS: CourseRecordRun[] = [
  { key: 'быстров борис', displayName: 'Быстров Борис', gender: Gender.male, dateIso: '2025-03-02', slug: '2025-03-02', timeMs: 1200000 },
  { key: 'быстров борис', displayName: 'Быстров Борис', gender: Gender.male, dateIso: '2024-03-10', slug: '2024-03-10', timeMs: 1260000 },
  // The same-event runner-up also beats the standing record, but the faster run wins the day.
  { key: 'азбукин андрей', displayName: 'Азбукин Андрей', gender: Gender.male, dateIso: '2025-03-09', slug: '2025-03-09', timeMs: 1150000 },
  { key: 'быстров борис', displayName: 'Быстров Борис', gender: Gender.male, dateIso: '2025-03-09', slug: '2025-03-09', timeMs: 1140000 },
  // Equalling the record later never takes it over.
  { key: 'азбукин андрей', displayName: 'Азбукин Андрей', gender: Gender.male, dateIso: '2025-04-06', slug: '2025-04-06', timeMs: 1140000 },
  {
    key: 'медленнов михаил',
    displayName: 'Медленнов Михаил',
    gender: Gender.male,
    dateIso: '2024-05-12',
    slug: '2024-05-12',
    timeMs: 1300000,
  },
  { key: 'ланская лидия', displayName: 'Ланская Лидия', gender: Gender.female, dateIso: '2025-05-11', slug: '2025-05-11', timeMs: 1500000 },
];

export const EXPECTED_COURSE_RECORD_HISTORY: CourseRecordHistory = {
  [Gender.male]: [
    {
      key: 'быстров борис',
      displayName: 'Быстров Борис',
      gender: Gender.male,
      dateIso: '2024-03-10',
      slug: '2024-03-10',
      timeMs: 1260000,
      previousMs: null,
    },
    {
      key: 'быстров борис',
      displayName: 'Быстров Борис',
      gender: Gender.male,
      dateIso: '2025-03-02',
      slug: '2025-03-02',
      timeMs: 1200000,
      previousMs: 1260000,
    },
    {
      key: 'быстров борис',
      displayName: 'Быстров Борис',
      gender: Gender.male,
      dateIso: '2025-03-09',
      slug: '2025-03-09',
      timeMs: 1140000,
      previousMs: 1200000,
    },
  ],
  [Gender.female]: [
    {
      key: 'ланская лидия',
      displayName: 'Ланская Лидия',
      gender: Gender.female,
      dateIso: '2025-05-11',
      slug: '2025-05-11',
      timeMs: 1500000,
      previousMs: null,
    },
  ],
};

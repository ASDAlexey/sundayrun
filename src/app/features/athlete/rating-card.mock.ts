import { CourseRecordHistory } from '../../core/history/course-records.type';
import { EventWinnerTimes } from '../../core/history/runner-scores.interface';
import { ANCHOR_EVENT, MALE_COURSE_RECORD_MS, WINNER_EVENTS } from '../../core/history/runner-scores.mock';
import { Gender } from '../../core/models/gender.enum';
import { RatingCardView } from './rating-card.interface';

/** The male course record behind `MALE_COURSE_RECORD_MS`; the women's board stays vacant. */
export const CARD_COURSE_RECORDS: CourseRecordHistory = {
  [Gender.male]: [
    {
      key: 'рекордсмен роман',
      displayName: 'Рекордсмен Роман',
      gender: Gender.male,
      dateIso: '2024-01-01',
      slug: '2024-01-01',
      timeMs: MALE_COURSE_RECORD_MS,
      previousMs: null,
    },
  ],
  [Gender.female]: [],
};

/** The scored events plus the runless anchor race that pins the form year at the anchor day. */
export const CARD_WINNER_EVENTS: EventWinnerTimes[] = [...WINNER_EVENTS, ANCHOR_EVENT];

/** `MALE_RUNS` against `CARD_WINNER_EVENTS`: all three metrics present. */
export const EXPECTED_RATING_CARD_VIEW: RatingCardView = {
  rankText: '92',
  rankRunsText: 'по 3 забегам',
  formText: '98,4',
  gradeText: '96,5',
};

/** The same events with a race two years past the last finish — the anchor leaves the form year empty. */
export const RESTED_WINNER_EVENTS: EventWinnerTimes[] = [
  ...WINNER_EVENTS,
  { slug: 'e-rest-anchor', dateIso: '2028-01-31', bestMaleMs: 1_200_000, bestFemaleMs: null },
];

/** The rested card over an empty record history: the form and the grade rest on dashes. */
export const EXPECTED_RESTED_VIEW: RatingCardView = {
  rankText: '92',
  rankRunsText: 'по 3 забегам',
  formText: null,
  gradeText: null,
};

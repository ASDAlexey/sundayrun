import { ATHLETES_PAGE_LINK } from '../../app.constant';
import { RACE_EVENT } from '../../core/github/spec-utils/race-fixtures';
import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { ParticipantRun } from '../../core/history/notables.interface';
import { RaceView } from './race-page.interface';

/** The published slug equals the event `dateIso`. */
export const RACE_PAGE_SLUG = RACE_EVENT.dateIso;

/** Fails `isValidEventSlug`, so the page must not fetch at all. */
export const MALFORMED_RACE_SLUG = 'not-a-date';

/** Well-formed but never published: the CDN answers 404 → `loadResults` resolves null. */
export const UNPUBLISHED_RACE_SLUG = '2026-01-04';

export const RESULTS_LOAD_ERROR_MESSAGE = 'results load failed';

/** The frozen «today» the spec pins the clock to: July is open, the fixture's June is closed. */
export const RACE_TODAY_ISO = '2026-07-12';

/** A later June race follows the fixture event, so it is NOT the month's final. */
export const OPEN_MONTH_CHRONOLOGY: string[] = [RACE_PAGE_SLUG, '2026-06-29'];

/** The fixture event closes June: the next race is already July. */
export const FINAL_MONTH_CHRONOLOGY: string[] = [RACE_PAGE_SLUG, '2026-07-05'];

/** `toRaceView(buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS))`. */
export const EXPECTED_RACE_VIEW: RaceView = {
  number: '12',
  dateLong: '28 июня 2026 г.',
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 3,
  // The one-lap runner finishes too; the fixture notes carry no newcomer or record tokens.
  summaryText: '2 финишёра, 0 новичков, 0 личных рекордов',
  // The only male ran the 2.3 km lap, so the male average has no qualifying 5 km times.
  medianTimeM: null,
  medianTimeF: '25:00',
  // The default chronology stub has a later June race, so the fixture event does not close the month.
  isMonthFinal: false,
  pdfAriaLabel: 'Протокол пробега № 12 (PDF)',
  rows: [
    {
      index: 1,
      fullName: 'Мария Иванова',
      athleteLink: [ATHLETES_PAGE_LINK, 'мария иванова'],
      athleteAriaLabel: 'История атлета Мария Иванова',
      time23: '11:30',
      time5: '25:00',
      paceText: '5:00',
      genderText: 'Ж',
      placeMText: '',
      placeFText: '1',
      // The default spec stub returns no participant runs, so the counter stays blank like the notable.
      finishCountText: '',
      club: 'Курск бегущий',
      note: '',
      notableText: '',
    },
    {
      index: 2,
      fullName: 'Олег Петров',
      athleteLink: [ATHLETES_PAGE_LINK, 'олег петров'],
      athleteAriaLabel: 'История атлета Олег Петров',
      time23: '15:00',
      time5: '',
      paceText: '6:31',
      genderText: 'М',
      placeMText: '1',
      placeFText: '',
      finishCountText: '',
      club: '',
      note: '',
      notableText: '',
    },
    {
      index: 3,
      fullName: 'Пётр Сидоров',
      athleteLink: [ATHLETES_PAGE_LINK, 'петр сидоров'],
      athleteAriaLabel: 'История атлета Пётр Сидоров',
      time23: '',
      time5: '',
      paceText: '',
      genderText: '',
      placeMText: '',
      placeFText: '',
      finishCountText: '',
      club: '',
      note: 'сход',
      notableText: '',
    },
  ],
};

/** Мария's run at `RACE_PAGE_SLUG` (25:00 per the fixture rows), by builder-friendly key. */
const mariaRun = (dateIso: string, timeMs: number, slug: string = dateIso): ParticipantRun => ({
  athleteKey: 'мария иванова',
  dateIso,
  slug,
  timeMs,
  distanceKm: FIVE_KM_DISTANCE_KM,
});

/** Five earlier runs with exactly one faster: the fixture 25:00 ranks 2nd of six career runs. */
export const RANK_PARTICIPANT_RUNS: ParticipantRun[] = [
  mariaRun('2025-08-03', 1440000),
  mariaRun('2025-09-07', 1560000),
  mariaRun('2025-10-05', 1560000),
  mariaRun('2025-11-02', 1560000),
  mariaRun('2026-05-03', 1560000),
  mariaRun(RACE_EVENT.dateIso, 1500000, RACE_PAGE_SLUG),
];

export const EXPECTED_RANK_NOTABLE_TEXT = '2-й результат за всё время';

/** All six of Мария's rank runs sit on or before the event date; the others never ran the 5 km here. */
export const EXPECTED_RANK_FINISH_COUNT_TEXTS: string[] = ['6', '', ''];

/** Three faster runs sit before the 6-month window; the three inside it are all slower. */
export const WINDOW_PARTICIPANT_RUNS: ParticipantRun[] = [
  mariaRun('2025-01-05', 1380000),
  mariaRun('2025-02-02', 1410000),
  mariaRun('2025-03-02', 1440000),
  mariaRun('2026-01-04', 1560000),
  mariaRun('2026-02-01', 1580000),
  mariaRun('2026-03-01', 1600000),
  mariaRun(RACE_EVENT.dateIso, 1500000, RACE_PAGE_SLUG),
];

export const EXPECTED_WINDOW_NOTABLE_TEXT = 'Лучший результат за 6 месяцев';

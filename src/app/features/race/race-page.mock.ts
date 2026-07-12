import { ATHLETES_PAGE_LINK } from '../../app.constant';
import { RACE_EVENT } from '../../core/github/spec-utils/race-fixtures';
import { RaceView } from './race-page.interface';

/** The published slug equals the event `dateIso`. */
export const RACE_PAGE_SLUG = RACE_EVENT.dateIso;

/** Fails `isValidEventSlug`, so the page must not fetch at all. */
export const MALFORMED_RACE_SLUG = 'not-a-date';

/** Well-formed but never published: the CDN answers 404 → `loadResults` resolves null. */
export const UNPUBLISHED_RACE_SLUG = '2026-01-04';

export const RESULTS_LOAD_ERROR_MESSAGE = 'results load failed';

/** `toRaceView(buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS))`. */
export const EXPECTED_RACE_VIEW: RaceView = {
  number: 12,
  dateLong: '28 июня 2026 г.',
  city: 'Курск',
  park: 'Боева дача',
  participantCount: 3,
  // The only male ran the 2.3 km lap, so the male average has no qualifying 5 km times.
  medianTimeM: null,
  medianTimeF: '25:00',
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
      club: 'Курск бегущий',
      note: '',
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
      club: '',
      note: '',
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
      club: '',
      note: 'сход',
    },
  ],
};

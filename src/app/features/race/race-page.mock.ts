import { ATHLETES_PAGE_LINK } from '../../app.constant';
import { PROTOCOL_ROWS, RACE_EVENT } from '../../core/github/spec-utils/race-fixtures';
import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { ParticipantRun } from '../../core/history/notables.interface';
import { Gender } from '../../core/models/gender.enum';
import { ProtocolRow } from '../../core/models/protocol-row.interface';
import { EventWeather } from '../../core/weather/event-weather.interface';
import { SelfAthlete } from '../../state/self-athlete.interface';
import { RACE_PAGE_BASE_LINK } from './race-page.constant';
import { RaceNoteBadgeKind } from './race-page.enum';
import { RacePrNoteView, RaceView } from './race-page.interface';

/** The published slug equals the event `dateIso`. */
export const RACE_PAGE_SLUG = RACE_EVENT.dateIso;

/** Fails `isValidEventSlug`, so the page must not fetch at all. */
export const MALFORMED_RACE_SLUG = 'not-a-date';

/** Well-formed but never published: the CDN answers 404 → `loadResults` resolves null. */
export const UNPUBLISHED_RACE_SLUG = '2026-01-04';

export const RESULTS_LOAD_ERROR_MESSAGE = 'results load failed';

/** The frozen «today» the spec pins the clock to: July is open, the fixture's June is closed. */
export const RACE_TODAY_ISO = '2026-07-12';

/** A stored reading without the temperature — the header renders no weather line for it. */
export const TEMPERATURELESS_WEATHER_MOCK: EventWeather = {
  temperatureC: null,
  apparentC: null,
  precipitationMm: 0,
  windKmh: 5,
  weatherCode: 2,
};

/** A reading with a temperature but no wind — the header line drops the «ветер …» part. */
export const WINDLESS_WEATHER_MOCK: EventWeather = {
  temperatureC: 12.3,
  apparentC: 11,
  precipitationMm: 0,
  windKmh: null,
  weatherCode: 3,
};

/** `weatherLineText(WINDLESS_WEATHER_MOCK)` — the temperature with its sky icon, no wind clause. */
export const EXPECTED_WINDLESS_WEATHER_TEXT = '☁️ +12°';

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
  // `WEATHER_MOCK` formatted: clear-sky icon, rounded temperature with the explicit plus, rounded wind.
  weatherText: '☀️ +26°, ветер 10 км/ч',
  // The default chronology stub has a later June race, so the fixture event does not close the month.
  isMonthFinal: false,
  pdfAriaLabel: 'Протокол пробега № 12 (PDF)',
  rows: [
    {
      index: 1,
      fullName: 'Мария Иванова',
      athleteKey: 'мария иванова',
      athleteLink: [ATHLETES_PAGE_LINK, 'мария иванова'],
      athleteAriaLabel: 'История атлета Мария Иванова',
      time23: '11:30',
      time5: '25:00',
      paceText: '5:00',
      genderText: 'Ж',
      placeMText: '',
      placeFText: '1',
      gapMText: '',
      gapFText: '',
      // The default spec stub returns no participant runs, so the counter stays blank like the notable.
      finishCountText: '',
      finishClubClass: '',
      club: 'Курск бегущий',
      noteBadges: [],
      notableText: '',
    },
    {
      index: 2,
      fullName: 'Олег Петров',
      athleteKey: 'олег петров',
      athleteLink: [ATHLETES_PAGE_LINK, 'олег петров'],
      athleteAriaLabel: 'История атлета Олег Петров',
      time23: '15:00',
      time5: '',
      paceText: '6:31',
      genderText: 'М',
      placeMText: '1',
      placeFText: '',
      gapMText: '',
      gapFText: '',
      finishCountText: '',
      finishClubClass: '',
      club: '',
      noteBadges: [],
      notableText: '',
    },
    {
      index: 3,
      fullName: 'Пётр Сидоров',
      athleteKey: 'петр сидоров',
      athleteLink: [ATHLETES_PAGE_LINK, 'петр сидоров'],
      athleteAriaLabel: 'История атлета Пётр Сидоров',
      time23: '',
      time5: '',
      paceText: '',
      genderText: '',
      placeMText: '',
      placeFText: '',
      gapMText: '',
      gapFText: '',
      finishCountText: '',
      finishClubClass: '',
      club: '',
      // An unrecognized organiser note stays running text — no chip, no icon.
      noteBadges: [{ kind: RaceNoteBadgeKind.plain, className: '', text: 'сход', prNote: null }],
      notableText: '',
    },
  ],
};

/** The header pick («Выбери себя») matching the first fixture row — exactly one row highlights. */
export const RACE_SELF_PICK: SelfAthlete = { key: 'мария иванова', displayName: 'Мария Иванова' };

const gapRow = (index: number, fullName: string, gender: ProtocolRow['gender'], place: number, totalMs: number): ProtocolRow => ({
  index,
  fullName,
  time23: '',
  time5: '25:00',
  totalMs,
  distanceKm: FIVE_KM_DISTANCE_KM,
  gender,
  placeM: gender === Gender.male ? place : null,
  placeF: gender === Gender.female ? place : null,
  club: '',
  note: '',
});

/** Two finishers per gender: each runner-up learns the gap to the place above, the winners stay clean. */
export const GAP_PROTOCOL_ROWS: ProtocolRow[] = [
  gapRow(1, 'Первый Пётр', Gender.male, 1, 1200000),
  gapRow(2, 'Второв Василий', Gender.male, 2, 1212000),
  gapRow(3, 'Анина Анна', Gender.female, 1, 1500000),
  gapRow(4, 'Близкова Белла', Gender.female, 2, 1530000),
];

/** Row-by-row `gapMText`/`gapFText` behind GAP_PROTOCOL_ROWS. */
export const EXPECTED_GAP_M_TEXTS = ['', '+0:12', '', ''];

export const EXPECTED_GAP_F_TEXTS = ['', '', '', '+0:30'];

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

/** Six career runs cross no milestone, so every badge stays neutral. */
export const EXPECTED_RANK_FINISH_CLUB_CLASSES: string[] = ['', '', ''];

/** 99 unique earlier dates (years 2020-2022) plus the event day: exactly a century of finishes. */
export const CLUB_PARTICIPANT_RUNS: ParticipantRun[] = [
  ...Array.from({ length: 99 }, (_, i) => {
    const year = 2020 + Math.floor(i / 48);
    const month = String((Math.floor(i / 4) % 12) + 1).padStart(2, '0');
    const day = String((i % 4) * 7 + 1).padStart(2, '0');

    return mariaRun(`${year}-${month}-${day}`, 1560000);
  }),
  mariaRun(RACE_EVENT.dateIso, 1500000, RACE_PAGE_SLUG),
];

export const EXPECTED_CLUB_FINISH_COUNT_TEXT = '100';

/** The century joins the 100 club: the badge takes the silver-scale modifier. */
export const EXPECTED_CLUB_BADGE_CLASS = 'race__finishes_100';

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

/**
 * The fixture rows re-noted to cover every badge kind: the record on Мария (so the previous best
 * can date and link it) plus the year best, the newcomer, the kids run, DNF and the legacy record.
 */
export const PR_NOTE_PROTOCOL_ROWS: ProtocolRow[] = PROTOCOL_ROWS.map((row) => {
  if (row.index === 1) {
    return { ...row, note: 'ЛР (было 26:00); Лучший результат 2026 г.' };
  }

  if (row.index === 2) {
    return { ...row, note: 'Первое участие; Дети' };
  }

  return { ...row, note: 'DNF; Личный рекорд' };
});

/** How `toNoteBadges` classifies `PR_NOTE_PROTOCOL_ROWS`, row by row. */
export const EXPECTED_NOTE_BADGE_KINDS: string[][] = [
  [RaceNoteBadgeKind.record, RaceNoteBadgeKind.yearBest],
  [RaceNoteBadgeKind.debut, RaceNoteBadgeKind.kids],
  [RaceNoteBadgeKind.status, RaceNoteBadgeKind.record],
];

/** Against `RANK_PARTICIPANT_RUNS`: the earlier best is the 24:00 of 2025-08-03 — its date and race join the note. */
export const EXPECTED_PR_NOTE_VIEW: RacePrNoteView = {
  before: 'ЛР (было ',
  label: '26:00 · 3 авг 2025',
  link: [RACE_PAGE_BASE_LINK, '2025-08-03'],
  after: ')',
};

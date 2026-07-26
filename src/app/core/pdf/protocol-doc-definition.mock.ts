import type { Content, ContextPageSize, TableCell } from 'pdfmake/interfaces';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from '../history/distance.constant';
import { PreviousBest } from '../history/previous-bests.interface';
import { Gender, GenderType } from '../models/gender.enum';
import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';
import { EventWeather } from '../weather/event-weather.interface';
import { WEATHER_MOCK } from '../weather/fetch-event-weather.mock';
import { ProtocolDocInput } from './protocol-doc-definition.interface';
import {
  ABBREVIATION_DNF,
  ABBREVIATION_DSQ,
  ABBREVIATIONS_MARGIN,
  ABBREVIATIONS_TITLE,
  AUTO_COLUMN_WIDTH,
  DNF_LABEL,
  EMPTY_CELL,
  FLEX_COLUMN_WIDTH,
  GENDER_LABELS,
  GROUP_COLUMN_SPAN,
  HEADER_ATHLETE,
  HEADER_CLUB,
  HEADER_FINISHES,
  HEADER_GENDER,
  HEADER_INDEX,
  HEADER_NOTE,
  HEADER_PLACE,
  HEADER_PLACE_F,
  HEADER_PLACE_M,
  HEADER_ROW_SPAN,
  HEADER_TIME,
  HEADER_TIME_23,
  HEADER_TIME_5,
  INTRO_LEADING_INDENT,
  INTRO_MARGIN,
  PARTICIPANTS_TITLE,
  PARTICIPANTS_TITLE_MARGIN,
  PDF_ALIGN_CENTER,
  PDF_ALIGN_JUSTIFY,
  PDF_ALIGN_RIGHT,
  PDF_PAGE_ORIENTATION,
  PROTOCOL_TITLE,
  PROTOCOL_TITLE_MARGIN,
  QR_CAPTION,
  QR_CAPTION_FONT_SIZE,
  QR_CAPTION_MARGIN,
  QR_SIZE,
  SIGNATURE_MARGIN,
  TABLE_HEADER_ROWS,
  TABLE_WIDTHS,
} from './protocol-doc-definition.constant';

export const PDF_EVENT_MOCK: RaceEvent = {
  number: 160,
  legacyNumber: '2.16',
  dateIso: '2020-09-20',
  city: 'г. Таганрог',
  park: 'ПКиО им. Горького',
  clubName: 'КЛБ «Легенда»',
  chairman: 'В.С. Хахуцкий',
};

export const MALE_WINNER_ROW_MOCK: ProtocolRow = {
  index: 1,
  fullName: 'Хахуцкий Виктор',
  time23: '07:57',
  time5: '17:40',
  totalMs: 1060000,
  distanceKm: FIVE_KM_DISTANCE_KM,
  gender: Gender.male,
  placeM: 1,
  placeF: null,
  club: 'КЛБ «Легенда»',
  note: 'ЛР (было 17:55); Лучший результат 2020 г.',
};

export const FEMALE_WINNER_ROW_MOCK: ProtocolRow = {
  index: 2,
  fullName: 'Фарафонова Екатерина',
  time23: '11:04',
  time5: '24:25',
  totalMs: 1465000,
  distanceKm: FIVE_KM_DISTANCE_KM,
  gender: Gender.female,
  placeM: null,
  placeF: 1,
  club: '',
  note: '',
};

/** 2.3 km-only runner: has a time but no 5 km result, place or known gender. */
export const PLACELESS_ROW_MOCK: ProtocolRow = {
  index: 3,
  fullName: 'Куликов Женя',
  time23: '12:30',
  time5: '',
  totalMs: 750000,
  distanceKm: TWO_THREE_KM_DISTANCE_KM,
  gender: null,
  placeM: null,
  placeF: null,
  club: '',
  note: '',
};

/** Non-finisher: both times empty, no places. */
export const DNF_ROW_MOCK: ProtocolRow = {
  index: 4,
  fullName: 'Дзюбак Сергей',
  time23: '',
  time5: '',
  totalMs: null,
  distanceKm: null,
  gender: Gender.male,
  placeM: null,
  placeF: null,
  club: '',
  note: '',
};

export const PDF_ROWS_MOCK: ProtocolRow[] = [MALE_WINNER_ROW_MOCK, FEMALE_WINNER_ROW_MOCK, PLACELESS_ROW_MOCK, DNF_ROW_MOCK];

/** Keyed by the normalized names; the one-lap and DNF rows stay out, so their cells render blank. */
export const PDF_FINISH_COUNTS_MOCK: Record<string, number> = {
  'хахуцкий виктор': 42,
  'фарафонова екатерина': 1,
};

/** Only the male winner set a record; the map dates his «ЛР» note, everyone else keeps the stored text. */
export const PDF_PREVIOUS_BESTS_MOCK: Record<string, PreviousBest> = {
  'хахуцкий виктор': { slug: '2020-03-15', dateIso: '2020-03-15', timeMs: 1075000 },
};

/** The whole builder input of the four-row sample protocol. */
export const PDF_DOC_INPUT_MOCK: ProtocolDocInput = {
  event: PDF_EVENT_MOCK,
  rows: PDF_ROWS_MOCK,
  finishCounts: PDF_FINISH_COUNTS_MOCK,
  previousBests: PDF_PREVIOUS_BESTS_MOCK,
  weather: WEATHER_MOCK,
};

/** The previous 17:55 gains the date of the run it fell at. */
export const EXPECTED_MALE_NOTE = 'ЛР (было 17:55 · 15 мар 2020); Лучший результат 2020 г.';

export const EXPECTED_LONG_DATE = '20 сентября 2020 г.';

/** `WEATHER_MOCK` rounded and stripped of the web line's emoji: 25.7 °C and 10.1 km/h on a dry course. */
export const EXPECTED_WEATHER_LINE = 'Погода: +26°, ветер 10 км/ч';

/** The date column carries the weather on its second line. */
export const EXPECTED_DATE_COLUMN = `${EXPECTED_LONG_DATE}\n${EXPECTED_WEATHER_LINE}`;

/** The QR target: the canonical origin plus the race route, whose slug is the event's ISO date. */
export const EXPECTED_QR_URL = 'https://asdalexey.github.io/sundayrun/races/2020-09-20';

/** A stored row without a temperature: nothing anchors the line, so the header keeps the date alone. */
export const TEMPERATURELESS_WEATHER_MOCK: EventWeather = { ...WEATHER_MOCK, temperatureC: null };

/** No wind reading and rain in the wet-course window: the line drops «ветер …» and gains the puddles. */
export const WET_WINDLESS_WEATHER_MOCK: EventWeather = { ...WEATHER_MOCK, windKmh: null, recentPrecipitationMm: 1.4 };

export const EXPECTED_WET_WINDLESS_WEATHER_LINE = 'Погода: +26°, трасса мокрая';

/** The race number is glued with non-breaking spaces (u00a0), so the narrow header never wraps inside it. */
export const EXPECTED_CENTER_HEADER = 'Воскресный парковый пробег № 160 (2.16)\nг. Таганрог';

export const EXPECTED_RIGHT_HEADER = 'ПКиО им. Горького\nКЛБ «Легенда»';

export const EXPECTED_INTRO =
  'Настоящим сообщаю, что нижеперечисленные спортсмены и волонтеры приняли активное участие в организации и проведении Воскресного паркового пробега в ПКиО им. Горького, г. Таганрог, который проходил 20.09.2020 г.';

export const EXPECTED_SIGNATURE_LEFT = 'Председатель КЛБ «Легенда»';

const HEADER_CELL_BASE = { bold: true, alignment: PDF_ALIGN_CENTER };

export const EXPECTED_HEADER_ROWS: TableCell[][] = [
  [
    { text: HEADER_INDEX, rowSpan: HEADER_ROW_SPAN, ...HEADER_CELL_BASE },
    { text: HEADER_ATHLETE, rowSpan: HEADER_ROW_SPAN, ...HEADER_CELL_BASE },
    { text: HEADER_TIME, colSpan: GROUP_COLUMN_SPAN, ...HEADER_CELL_BASE },
    {},
    { text: HEADER_GENDER, rowSpan: HEADER_ROW_SPAN, ...HEADER_CELL_BASE },
    { text: HEADER_PLACE, colSpan: GROUP_COLUMN_SPAN, ...HEADER_CELL_BASE },
    {},
    { text: HEADER_FINISHES, rowSpan: HEADER_ROW_SPAN, ...HEADER_CELL_BASE },
    { text: HEADER_CLUB, rowSpan: HEADER_ROW_SPAN, ...HEADER_CELL_BASE },
    { text: HEADER_NOTE, rowSpan: HEADER_ROW_SPAN, ...HEADER_CELL_BASE },
  ],
  [
    {},
    {},
    { text: HEADER_TIME_23, ...HEADER_CELL_BASE },
    { text: HEADER_TIME_5, ...HEADER_CELL_BASE },
    {},
    { text: HEADER_PLACE_M, ...HEADER_CELL_BASE },
    { text: HEADER_PLACE_F, ...HEADER_CELL_BASE },
    {},
    {},
    {},
  ],
];

export const EXPECTED_MALE_ROW_CELLS: TableCell[] = [
  { text: '1', alignment: PDF_ALIGN_CENTER },
  { text: MALE_WINNER_ROW_MOCK.fullName },
  { text: MALE_WINNER_ROW_MOCK.time23, alignment: PDF_ALIGN_CENTER },
  { text: MALE_WINNER_ROW_MOCK.time5, alignment: PDF_ALIGN_CENTER },
  { text: GENDER_LABELS[Gender.male], alignment: PDF_ALIGN_CENTER },
  { text: '1', alignment: PDF_ALIGN_CENTER },
  { text: EMPTY_CELL, alignment: PDF_ALIGN_CENTER },
  { text: '42', alignment: PDF_ALIGN_CENTER },
  { text: MALE_WINNER_ROW_MOCK.club },
  { text: EXPECTED_MALE_NOTE },
];

export const EXPECTED_FEMALE_ROW_CELLS: TableCell[] = [
  { text: '2', alignment: PDF_ALIGN_CENTER },
  { text: FEMALE_WINNER_ROW_MOCK.fullName },
  { text: FEMALE_WINNER_ROW_MOCK.time23, alignment: PDF_ALIGN_CENTER },
  { text: FEMALE_WINNER_ROW_MOCK.time5, alignment: PDF_ALIGN_CENTER },
  { text: GENDER_LABELS[Gender.female], alignment: PDF_ALIGN_CENTER },
  { text: EMPTY_CELL, alignment: PDF_ALIGN_CENTER },
  { text: '1', alignment: PDF_ALIGN_CENTER },
  { text: '1', alignment: PDF_ALIGN_CENTER },
  { text: FEMALE_WINNER_ROW_MOCK.club },
  { text: FEMALE_WINNER_ROW_MOCK.note },
];

export const EXPECTED_PLACELESS_ROW_CELLS: TableCell[] = [
  { text: '3', alignment: PDF_ALIGN_CENTER },
  { text: PLACELESS_ROW_MOCK.fullName },
  { text: PLACELESS_ROW_MOCK.time23, alignment: PDF_ALIGN_CENTER },
  { text: EMPTY_CELL, alignment: PDF_ALIGN_CENTER },
  { text: EMPTY_CELL, alignment: PDF_ALIGN_CENTER },
  { text: EMPTY_CELL, alignment: PDF_ALIGN_CENTER },
  { text: EMPTY_CELL, alignment: PDF_ALIGN_CENTER },
  { text: EMPTY_CELL, alignment: PDF_ALIGN_CENTER },
  { text: PLACELESS_ROW_MOCK.club },
  { text: PLACELESS_ROW_MOCK.note },
];

export const EXPECTED_DNF_ROW_CELLS: TableCell[] = [
  { text: '4', alignment: PDF_ALIGN_CENTER },
  { text: DNF_ROW_MOCK.fullName },
  { text: EMPTY_CELL, alignment: PDF_ALIGN_CENTER },
  { text: DNF_LABEL, alignment: PDF_ALIGN_CENTER },
  { text: GENDER_LABELS[Gender.male], alignment: PDF_ALIGN_CENTER },
  { text: EMPTY_CELL, alignment: PDF_ALIGN_CENTER },
  { text: EMPTY_CELL, alignment: PDF_ALIGN_CENTER },
  { text: EMPTY_CELL, alignment: PDF_ALIGN_CENTER },
  { text: DNF_ROW_MOCK.club },
  { text: DNF_ROW_MOCK.note },
];

/** The abbreviations list and the protocol-page QR beside it, the body's closing row. */
export const EXPECTED_ABBREVIATIONS_WITH_QR: Content = {
  columns: [
    {
      width: FLEX_COLUMN_WIDTH,
      stack: [{ text: ABBREVIATIONS_TITLE }, { text: ABBREVIATION_DNF }, { text: ABBREVIATION_DSQ }],
    },
    {
      width: AUTO_COLUMN_WIDTH,
      stack: [
        { qr: EXPECTED_QR_URL, fit: QR_SIZE, alignment: PDF_ALIGN_RIGHT },
        { text: QR_CAPTION, fontSize: QR_CAPTION_FONT_SIZE, alignment: PDF_ALIGN_RIGHT, margin: QR_CAPTION_MARGIN },
      ],
    },
  ],
  margin: ABBREVIATIONS_MARGIN,
};

/** The whole document body: page header, title, intro, participants table, abbreviations with the QR (the signature is a footer). */
export const EXPECTED_DOC_CONTENT: Content[] = [
  {
    columns: [
      { width: FLEX_COLUMN_WIDTH, text: EXPECTED_DATE_COLUMN },
      { width: FLEX_COLUMN_WIDTH, text: EXPECTED_CENTER_HEADER, alignment: PDF_ALIGN_CENTER },
      { width: FLEX_COLUMN_WIDTH, text: EXPECTED_RIGHT_HEADER, alignment: PDF_ALIGN_RIGHT },
    ],
  },
  { text: PROTOCOL_TITLE, bold: true, alignment: PDF_ALIGN_CENTER, margin: PROTOCOL_TITLE_MARGIN },
  { text: EXPECTED_INTRO, alignment: PDF_ALIGN_JUSTIFY, leadingIndent: INTRO_LEADING_INDENT, margin: INTRO_MARGIN },
  { text: PARTICIPANTS_TITLE, bold: true, alignment: PDF_ALIGN_CENTER, margin: PARTICIPANTS_TITLE_MARGIN },
  {
    table: {
      headerRows: TABLE_HEADER_ROWS,
      widths: [...TABLE_WIDTHS],
      body: [
        ...EXPECTED_HEADER_ROWS,
        EXPECTED_MALE_ROW_CELLS,
        EXPECTED_FEMALE_ROW_CELLS,
        EXPECTED_PLACELESS_ROW_CELLS,
        EXPECTED_DNF_ROW_CELLS,
      ],
    },
  },
  EXPECTED_ABBREVIATIONS_WITH_QR,
];

/** The last page's footer: club chairman on the left, name on the right. */
export const EXPECTED_SIGNATURE_FOOTER: Content = {
  columns: [
    { width: FLEX_COLUMN_WIDTH, text: EXPECTED_SIGNATURE_LEFT },
    { width: FLEX_COLUMN_WIDTH, text: PDF_EVENT_MOCK.chairman, alignment: PDF_ALIGN_RIGHT },
  ],
  margin: SIGNATURE_MARGIN,
};

/** A protocol of this many pages, so the signature falls on page 2 and page 1 stays bare. */
export const EXPECTED_FOOTER_PAGE_COUNT = 2;

/** The page whose footer must stay empty in a two-page protocol. */
export const FIRST_PAGE = 1;

/** The third argument pdfmake hands a footer builder; this one ignores it, so any A4 page will do. */
export const FOOTER_PAGE_SIZE_MOCK: ContextPageSize = { width: 595.28, height: 841.89, orientation: PDF_PAGE_ORIENTATION };

/**
 * A real full-size protocol (26.06.2026, 15 rows, three of them with a wrapping «ЛР» note) — the
 * one that used to spill its signature alone onto a second page. The integration spec renders it
 * to guard the single-page fit, which only the real layout engine can tell.
 */
export const FULL_PAGE_EVENT_MOCK: RaceEvent = {
  number: 266,
  legacyNumber: '',
  dateIso: '2026-06-26',
  city: 'г. Таганрог',
  park: 'ПКиО им. Горького',
  clubName: 'КЛБ «Легенда»',
  chairman: 'В.С. Хахуцкий',
};

/** [name, 2.3 km, 5 km, gender, place M, place F, finishes, note]; an empty 5 km time is a DNF row. */
const FULL_PAGE_RAW_ROWS: readonly [string, string, string, GenderType, number | null, number | null, number, string][] = [
  ['Хахуцкий Виктор', '8:05', '17:31', Gender.male, 1, null, 62, 'Лучший результат 2026 г.'],
  ['Кияшко Дмитрий', '8:17', '18:35', Gender.male, 2, null, 57, ''],
  ['Троилин Антон', '8:19', '18:47', Gender.male, 3, null, 131, ''],
  ['Альшаков Сергей', '10:36', '22:52', Gender.male, 4, null, 1, 'Первое участие'],
  ['Новиков Сергей', '10:35', '22:53', Gender.male, 5, null, 41, ''],
  ['Загребельный Роман', '10:39', '24:00', Gender.male, 6, null, 6, 'ЛР (было 24:34 · 11 июн 2023)'],
  ['Зубкова Наталья', '11:18', '25:23', Gender.female, null, 1, 53, ''],
  ['Дзюбак Сергей', '12:22', '26:35', Gender.male, 7, null, 186, ''],
  ['Дорожкина Надежда', '12:23', '26:45', Gender.female, null, 2, 1, 'Первое участие'],
  ['Шевердина Алена', '12:15', '26:49', Gender.female, null, 3, 1, 'Первое участие'],
  ['Ширшов Денис', '12:17', '26:50', Gender.male, 8, null, 76, ''],
  ['Курганская Марина', '12:43', '28:58', Gender.female, null, 4, 2, 'ЛР (было 30:49 · 26 апр 2026)'],
  ['Шалак Федор', '13:10', '31:00', Gender.male, 9, null, 2, 'ЛР (было 33:56 · 21 июн 2026)'],
  ['Парфенова Яна', '', '', Gender.female, null, null, 3, ''],
  ['Бобнева Оксана', '', '', Gender.female, null, null, 5, ''],
];

/** Any positive total: the doc definition only reads it to tell a finisher from a DNF row. */
const FULL_PAGE_TOTAL_MS = 1000;

export const FULL_PAGE_ROWS_MOCK: ProtocolRow[] = FULL_PAGE_RAW_ROWS.map(
  ([fullName, time23, time5, gender, placeM, placeF, , note], index): ProtocolRow => ({
    index: index + 1,
    fullName,
    time23,
    time5,
    totalMs: time5 === EMPTY_CELL ? null : FULL_PAGE_TOTAL_MS,
    distanceKm: time5 === EMPTY_CELL ? null : FIVE_KM_DISTANCE_KM,
    gender,
    placeM,
    placeF,
    club: EMPTY_CELL,
    note,
  }),
);

export const FULL_PAGE_FINISH_COUNTS_MOCK: Record<string, number> = Object.fromEntries(
  FULL_PAGE_RAW_ROWS.map(([fullName, , , , , , finishes]) => [fullName.toLowerCase(), finishes]),
);

/** The full-size protocol as the builder takes it, weather line and all — the worst case for the single-page fit. */
export const FULL_PAGE_DOC_INPUT_MOCK: ProtocolDocInput = {
  event: FULL_PAGE_EVENT_MOCK,
  rows: FULL_PAGE_ROWS_MOCK,
  finishCounts: FULL_PAGE_FINISH_COUNTS_MOCK,
  previousBests: {},
  weather: WEATHER_MOCK,
};

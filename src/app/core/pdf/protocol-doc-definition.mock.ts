import type { Content, TableCell } from 'pdfmake/interfaces';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from '../history/distance.constant';
import { Gender } from '../models/gender.enum';
import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';
import {
  ABBREVIATION_DNF,
  ABBREVIATION_DSQ,
  ABBREVIATIONS_MARGIN,
  ABBREVIATIONS_TITLE,
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
  PROTOCOL_TITLE,
  PROTOCOL_TITLE_MARGIN,
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
  note: 'Лучший результат 2020 г.',
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

export const EXPECTED_LONG_DATE = '20 сентября 2020 г.';

export const EXPECTED_CENTER_HEADER = 'Воскресный парковый пробег № 160 (2.16)\nг. Таганрог';

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
  { text: MALE_WINNER_ROW_MOCK.note },
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

/** The whole document body: page header, title, intro, participants table, abbreviations, signature. */
export const EXPECTED_DOC_CONTENT: Content[] = [
  {
    columns: [
      { width: FLEX_COLUMN_WIDTH, text: EXPECTED_LONG_DATE },
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
  { text: ABBREVIATIONS_TITLE, margin: ABBREVIATIONS_MARGIN },
  { text: ABBREVIATION_DNF },
  { text: ABBREVIATION_DSQ },
  {
    columns: [
      { width: FLEX_COLUMN_WIDTH, text: EXPECTED_SIGNATURE_LEFT },
      { width: FLEX_COLUMN_WIDTH, text: PDF_EVENT_MOCK.chairman, alignment: PDF_ALIGN_RIGHT },
    ],
    margin: SIGNATURE_MARGIN,
  },
];

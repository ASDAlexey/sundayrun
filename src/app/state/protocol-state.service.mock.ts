import { strToU8, zipSync } from 'fflate';

import { FIVE_KM_DISTANCE_KM } from '../core/history/distance.constant';
import { AthletesHistory } from '../core/models/athletes-history.type';
import { Gender } from '../core/models/gender.enum';
import { RaceEvent } from '../core/models/race-event.interface';
import { WORKBOOK_PATH, WORKBOOK_RELS_PATH, XL_ROOT } from '../core/xlsx/xlsx-reader.constant';

export const IMPORT_FILE_NAME = '14.06.2026.xlsx';

export const EXPECTED_SUGGESTED_DATE_ISO = '2026-06-14';

/** File name without a DD.MM.YYYY date part. */
export const UNDATED_FILE_NAME = 'results.xlsx';

export const KNOWN_MALE_NAME = 'Троилин Антон';

export const KNOWN_FEMALE_NAME = 'Хандыга Наталья';

/** Single-token name: gender inference cannot resolve it. */
export const UNKNOWN_GENDER_NAME = 'Инкогнито';

export const KNOWN_MALE_ID = 1;

export const UNKNOWN_GENDER_ID = 3;

export const EXPECTED_PARTICIPANT_COUNT = 3;

export const EXPECTED_MALE_TOTAL_MS = 1143028;

export const NOTE_TEXT = 'волонтёр';

export const RACE_EVENT: RaceEvent = {
  number: 42,
  dateIso: '2026-06-14',
  city: 'Москва',
  park: 'Кузьминки',
  clubName: 'Парсек',
  chairman: 'Иванов Иван',
};

const PREVIOUS_BEST_MS = 1200000;

/** History where the known male already ran 5 km slower, so his imported time is an all-time PR. */
export const IMPORT_HISTORY: AthletesHistory = {
  'троилин антон': {
    key: 'троилин антон',
    displayName: KNOWN_MALE_NAME,
    gender: Gender.male,
    participationSlugs: ['2026-06-07'],
    runs: [{ dateIso: '2026-06-07', slug: '2026-06-07', timeMs: PREVIOUS_BEST_MS, distanceKm: FIVE_KM_DISTANCE_KM }],
    bestMs: PREVIOUS_BEST_MS,
    bestMsByYear: { '2026': PREVIOUS_BEST_MS },
  },
};

/** `buildAutoNote` output for beating `PREVIOUS_BEST_MS` (20:00). */
export const EXPECTED_PR_NOTE = 'ЛР (было 20:00)';

const KNOWN_FEMALE_TOTAL_MS = 1260000;

const UNKNOWN_GENDER_TOTAL_MS = 1500000;

/**
 * `IMPORT_HISTORY` after the imported event (2026-06-14) has already been published once:
 * every participant carries their own run of that date, so a naive auto-notes pass would
 * compare each athlete against themselves and lose every note.
 */
export const REPUBLISHED_HISTORY: AthletesHistory = {
  'троилин антон': {
    key: 'троилин антон',
    displayName: KNOWN_MALE_NAME,
    gender: Gender.male,
    participationSlugs: ['2026-06-07', EXPECTED_SUGGESTED_DATE_ISO],
    runs: [
      { dateIso: '2026-06-07', slug: '2026-06-07', timeMs: PREVIOUS_BEST_MS, distanceKm: FIVE_KM_DISTANCE_KM },
      {
        dateIso: EXPECTED_SUGGESTED_DATE_ISO,
        slug: EXPECTED_SUGGESTED_DATE_ISO,
        timeMs: EXPECTED_MALE_TOTAL_MS,
        distanceKm: FIVE_KM_DISTANCE_KM,
      },
    ],
    bestMs: EXPECTED_MALE_TOTAL_MS,
    bestMsByYear: { '2026': EXPECTED_MALE_TOTAL_MS },
  },
  'хандыга наталья': {
    key: 'хандыга наталья',
    displayName: KNOWN_FEMALE_NAME,
    gender: Gender.female,
    participationSlugs: [EXPECTED_SUGGESTED_DATE_ISO],
    runs: [
      {
        dateIso: EXPECTED_SUGGESTED_DATE_ISO,
        slug: EXPECTED_SUGGESTED_DATE_ISO,
        timeMs: KNOWN_FEMALE_TOTAL_MS,
        distanceKm: FIVE_KM_DISTANCE_KM,
      },
    ],
    bestMs: KNOWN_FEMALE_TOTAL_MS,
    bestMsByYear: { '2026': KNOWN_FEMALE_TOTAL_MS },
  },
  инкогнито: {
    key: 'инкогнито',
    displayName: UNKNOWN_GENDER_NAME,
    gender: null,
    participationSlugs: [EXPECTED_SUGGESTED_DATE_ISO],
    runs: [
      {
        dateIso: EXPECTED_SUGGESTED_DATE_ISO,
        slug: EXPECTED_SUGGESTED_DATE_ISO,
        timeMs: UNKNOWN_GENDER_TOTAL_MS,
        distanceKm: FIVE_KM_DISTANCE_KM,
      },
    ],
    bestMs: UNKNOWN_GENDER_TOTAL_MS,
    bestMsByYear: { '2026': UNKNOWN_GENDER_TOTAL_MS },
  },
};

const FUTURE_FASTER_MS = 1000000;

/**
 * The known male's only run is a FUTURE faster one (a back-dated import scenario):
 * auto-notes for 2026-06-14 must not see it and must treat him as a first-timer.
 */
export const FUTURE_ONLY_HISTORY: AthletesHistory = {
  'троилин антон': {
    key: 'троилин антон',
    displayName: KNOWN_MALE_NAME,
    gender: Gender.male,
    participationSlugs: ['2026-06-21'],
    runs: [{ dateIso: '2026-06-21', slug: '2026-06-21', timeMs: FUTURE_FASTER_MS, distanceKm: FIVE_KM_DISTANCE_KM }],
    bestMs: FUTURE_FASTER_MS,
    bestMsByYear: { '2026': FUTURE_FASTER_MS },
  },
};

const SHEET_TARGET = 'worksheets/sheet1.xml';

const WORKBOOK_XML =
  '<workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
  '<sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets>' +
  '</workbook>';

const WORKBOOK_RELS_XML = `<Relationships><Relationship Id="rId1" Target="${SHEET_TARGET}"/></Relationships>`;

function xmlRow(cells: string[]): string {
  return `<row>${cells.map((cell) => `<c t="inlineStr"><is><t>${cell}</t></is></c>`).join('')}</row>`;
}

const SHEET_XML =
  '<worksheet><sheetData>' +
  xmlRow(['Name', 'Total', 'Avg/lap', 'Avg/km', 'Lap 1', 'Lap 2']) +
  xmlRow([KNOWN_MALE_NAME, '0:19:03,028', '', '', '0:08:29,705', '0:10:33,323']) +
  xmlRow([KNOWN_FEMALE_NAME, '0:21:00,000', '', '', '0:10:00,000', '0:11:00,000']) +
  xmlRow([UNKNOWN_GENDER_NAME, '0:25:00,000', '', '', '0:12:00,000', '0:13:00,000']) +
  '</sheetData></worksheet>';

/** A minimal real xlsx (inline strings only) with three athletes: M, F and unresolvable gender. */
export const IMPORT_XLSX_BYTES: Uint8Array = zipSync({
  [WORKBOOK_PATH]: strToU8(WORKBOOK_XML),
  [WORKBOOK_RELS_PATH]: strToU8(WORKBOOK_RELS_XML),
  [`${XL_ROOT}${SHEET_TARGET}`]: strToU8(SHEET_XML),
});

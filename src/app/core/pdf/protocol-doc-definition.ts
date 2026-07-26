import type { Column, Content, ContentColumns, ContentTable, ContentText, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import { formatRaceNumber } from '../github/race-number';
import { normalizeAthleteKey } from '../history/athlete-key';
import { prNoteWithDate } from '../history/pr-note';
import { PreviousBest } from '../history/previous-bests.interface';
import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';
import { EMPTY_TIME } from '../protocol/protocol-builder.constant';
import { formatRussianDateLong, formatRussianDateShort } from '../time/russian-date';
import { EventWeather } from '../weather/event-weather.interface';
import { temperatureText } from '../weather/temperature-text';
import { isWetCourse } from '../weather/weather-line';
import { WEATHER_PART_SEPARATOR } from '../weather/weather-line.constant';
import { ProtocolDocInput } from './protocol-doc-definition.interface';
import {
  ABBREVIATION_DNF,
  ABBREVIATION_DSQ,
  ABBREVIATIONS_MARGIN,
  ABBREVIATIONS_TITLE,
  AUTO_COLUMN_WIDTH,
  DNF_LABEL,
  EMPTY_CELL,
  EMPTY_FOOTER,
  EVENT_TITLE_PREFIX,
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
  INTRO_BEFORE_DATE,
  INTRO_BEFORE_PARK,
  INTRO_LEADING_INDENT,
  INTRO_MARGIN,
  INTRO_PART_SEPARATOR,
  LINE_BREAK,
  NON_BREAKING_SPACE,
  PARTICIPANTS_TITLE,
  PARTICIPANTS_TITLE_MARGIN,
  PDF_ALIGN_CENTER,
  PDF_ALIGN_JUSTIFY,
  PDF_ALIGN_RIGHT,
  PDF_FONT_FAMILY,
  PDF_FONT_SIZE,
  PDF_PAGE_MARGINS,
  PDF_PAGE_ORIENTATION,
  PDF_PAGE_SIZE,
  PROTOCOL_TITLE,
  PROTOCOL_TITLE_MARGIN,
  QR_CAPTION,
  QR_CAPTION_FONT_SIZE,
  QR_CAPTION_MARGIN,
  QR_SIZE,
  RACE_PAGE_URL_PREFIX,
  SIGNATURE_MARGIN,
  SIGNATURE_PREFIX,
  TABLE_HEADER_ROWS,
  TABLE_WIDTHS,
  WEATHER_PREFIX,
  WEATHER_WET_COURSE,
  WEATHER_WIND_PREFIX,
  WEATHER_WIND_SUFFIX,
} from './protocol-doc-definition.constant';

/**
 * pdfmake document definition of the one-page A4 race protocol
 * (mirrors the reference TCPDF sample): page header, 'ПРОТОКОЛ' title,
 * justified intro, participants table, abbreviations beside the site QR and signature.
 * The signature sits in the bottom margin band of the LAST page instead of the flow: in the flow it
 * carried a fixed gap above it and a protocol whose table ended a few points too low spilled the
 * signature — and only the signature — onto a second page. As a footer it costs the body nothing and
 * a protocol that fits by its table fits as a whole.
 */
export function buildProtocolDocDefinition({ event, rows, finishCounts, previousBests, weather }: ProtocolDocInput): TDocumentDefinitions {
  return {
    pageSize: PDF_PAGE_SIZE,
    pageOrientation: PDF_PAGE_ORIENTATION,
    pageMargins: PDF_PAGE_MARGINS,
    defaultStyle: { font: PDF_FONT_FAMILY, fontSize: PDF_FONT_SIZE },
    content: [
      buildPageHeader(event, weather),
      buildTitle(),
      buildIntro(event),
      buildParticipantsTitle(),
      buildParticipantsTable(rows, finishCounts, previousBests),
      buildAbbreviationsWithQr(event),
    ],
    footer: (currentPage: number, pageCount: number): Content => (currentPage === pageCount ? buildSignature(event) : EMPTY_FOOTER),
  };
}

/**
 * Left: long date and, under it, the start weather; center: event name + city; right: park + club.
 * The weather rides the date column because it is the only one with a spare line — an event without
 * a stored reading keeps the date there alone.
 */
function buildPageHeader(event: RaceEvent, weather: EventWeather | null): ContentColumns {
  return {
    columns: [
      { width: FLEX_COLUMN_WIDTH, text: `${formatRussianDateLong(event.dateIso)}${weatherHeaderLine(weather)}` },
      {
        width: FLEX_COLUMN_WIDTH,
        text: `${EVENT_TITLE_PREFIX}${raceNumberNoWrap(event)}${LINE_BREAK}${event.city}`,
        alignment: PDF_ALIGN_CENTER,
      },
      { width: FLEX_COLUMN_WIDTH, text: `${event.park}${LINE_BREAK}${event.clubName}`, alignment: PDF_ALIGN_RIGHT },
    ],
  };
}

/**
 * «\nПогода: +26°, ветер 10 км/ч, трасса мокрая» — the stored 9:00 course reading as the second line
 * of the date column, empty (the leading break included) without a temperature to anchor it. Unlike
 * the web line it carries no sky emoji: PT Serif has no glyph for one and pdfmake would print a box.
 */
function weatherHeaderLine(weather: EventWeather | null): string {
  if (weather === null) {
    return EMPTY_CELL;
  }

  const { temperatureC, windKmh } = weather;

  if (temperatureC === null) {
    return EMPTY_CELL;
  }

  const parts = [temperatureText(temperatureC)];

  if (windKmh !== null) {
    parts.push(`${WEATHER_WIND_PREFIX}${Math.round(windKmh)}${WEATHER_WIND_SUFFIX}`);
  }

  if (isWetCourse(weather)) {
    parts.push(WEATHER_WET_COURSE);
  }

  return `${LINE_BREAK}${WEATHER_PREFIX}${parts.join(WEATHER_PART_SEPARATOR)}`;
}

/** «105 (221)» glued with non-breaking spaces, so a narrow header wraps before the number — never inside it. */
function raceNumberNoWrap(event: RaceEvent): string {
  return formatRaceNumber(event.number, event.legacyNumber).replaceAll(' ', NON_BREAKING_SPACE);
}

function buildTitle(): ContentText {
  return { text: PROTOCOL_TITLE, bold: true, alignment: PDF_ALIGN_CENTER, margin: PROTOCOL_TITLE_MARGIN };
}

function buildIntro(event: RaceEvent): ContentText {
  return {
    text: `${INTRO_BEFORE_PARK}${event.park}${INTRO_PART_SEPARATOR}${event.city}${INTRO_BEFORE_DATE}${formatRussianDateShort(event.dateIso)}`,
    alignment: PDF_ALIGN_JUSTIFY,
    leadingIndent: INTRO_LEADING_INDENT,
    margin: INTRO_MARGIN,
  };
}

function buildParticipantsTitle(): ContentText {
  return { text: PARTICIPANTS_TITLE, bold: true, alignment: PDF_ALIGN_CENTER, margin: PARTICIPANTS_TITLE_MARGIN };
}

function buildParticipantsTable(
  rows: ProtocolRow[],
  finishCounts: Record<string, number>,
  previousBests: Record<string, PreviousBest>,
): ContentTable {
  return {
    table: {
      headerRows: TABLE_HEADER_ROWS,
      widths: [...TABLE_WIDTHS],
      body: [...buildTableHeaderRows(), ...rows.map((row) => buildTableBodyRow(row, finishCounts, previousBests))],
    },
  };
}

/** Two-row header: 'Время' and 'Место' span two sub-columns, the rest span both rows. */
function buildTableHeaderRows(): TableCell[][] {
  return [
    [
      headerCell(HEADER_INDEX, { rowSpan: HEADER_ROW_SPAN }),
      headerCell(HEADER_ATHLETE, { rowSpan: HEADER_ROW_SPAN }),
      headerCell(HEADER_TIME, { colSpan: GROUP_COLUMN_SPAN }),
      {},
      headerCell(HEADER_GENDER, { rowSpan: HEADER_ROW_SPAN }),
      headerCell(HEADER_PLACE, { colSpan: GROUP_COLUMN_SPAN }),
      {},
      headerCell(HEADER_FINISHES, { rowSpan: HEADER_ROW_SPAN }),
      headerCell(HEADER_CLUB, { rowSpan: HEADER_ROW_SPAN }),
      headerCell(HEADER_NOTE, { rowSpan: HEADER_ROW_SPAN }),
    ],
    [{}, {}, headerCell(HEADER_TIME_23), headerCell(HEADER_TIME_5), {}, headerCell(HEADER_PLACE_M), headerCell(HEADER_PLACE_F), {}, {}, {}],
  ];
}

function headerCell(text: string, spans: { rowSpan?: number; colSpan?: number } = {}): TableCell {
  return { text, bold: true, alignment: PDF_ALIGN_CENTER, ...spans };
}

/** Name, club and note are left-aligned; every numeric cell is centered. */
function buildTableBodyRow(
  row: ProtocolRow,
  finishCounts: Record<string, number>,
  previousBests: Record<string, PreviousBest>,
): TableCell[] {
  const athleteKey = normalizeAthleteKey(row.fullName);
  const finishCount = finishCounts[athleteKey];

  return [
    { text: String(row.index), alignment: PDF_ALIGN_CENTER },
    { text: row.fullName },
    { text: row.time23, alignment: PDF_ALIGN_CENTER },
    { text: isDnfRow(row) ? DNF_LABEL : row.time5, alignment: PDF_ALIGN_CENTER },
    { text: row.gender === null ? EMPTY_CELL : GENDER_LABELS[row.gender], alignment: PDF_ALIGN_CENTER },
    { text: row.placeM === null ? EMPTY_CELL : String(row.placeM), alignment: PDF_ALIGN_CENTER },
    { text: row.placeF === null ? EMPTY_CELL : String(row.placeF), alignment: PDF_ALIGN_CENTER },
    { text: finishCount === undefined ? EMPTY_CELL : String(finishCount), alignment: PDF_ALIGN_CENTER },
    { text: row.club },
    { text: prNoteWithDate(row.note, previousBests[athleteKey]) },
  ];
}

/** The protocol builder emits DNF rows as the only rows without any recorded time. */
function isDnfRow(row: ProtocolRow): boolean {
  return row.time23 === EMPTY_TIME && row.time5 === EMPTY_TIME;
}

/**
 * The abbreviations and the QR of this event's protocol page share one row: the list is three short
 * lines and the space to its right was blank anyway, so the QR costs the page only the height it
 * exceeds the list by — a printed protocol on the park's noticeboard leads to the site for that.
 */
function buildAbbreviationsWithQr(event: RaceEvent): ContentColumns {
  return {
    columns: [{ width: FLEX_COLUMN_WIDTH, stack: buildAbbreviations() }, buildQrColumn(event)],
    margin: ABBREVIATIONS_MARGIN,
  };
}

function buildAbbreviations(): ContentText[] {
  return [{ text: ABBREVIATIONS_TITLE }, { text: ABBREVIATION_DNF }, { text: ABBREVIATION_DSQ }];
}

/** The square is right-aligned on its caption — the widest line of the column, and what sets its width. */
function buildQrColumn(event: RaceEvent): Column {
  return {
    width: AUTO_COLUMN_WIDTH,
    stack: [
      { qr: `${RACE_PAGE_URL_PREFIX}${event.dateIso}`, fit: QR_SIZE, alignment: PDF_ALIGN_RIGHT },
      { text: QR_CAPTION, fontSize: QR_CAPTION_FONT_SIZE, alignment: PDF_ALIGN_RIGHT, margin: QR_CAPTION_MARGIN },
    ],
  };
}

function buildSignature(event: RaceEvent): ContentColumns {
  return {
    columns: [
      { width: FLEX_COLUMN_WIDTH, text: `${SIGNATURE_PREFIX}${event.clubName}` },
      { width: FLEX_COLUMN_WIDTH, text: event.chairman, alignment: PDF_ALIGN_RIGHT },
    ],
    margin: SIGNATURE_MARGIN,
  };
}

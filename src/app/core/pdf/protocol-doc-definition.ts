import type { ContentColumns, ContentTable, ContentText, TableCell, TDocumentDefinitions } from 'pdfmake/interfaces';
import { formatRaceNumber } from '../github/race-number';
import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';
import { EMPTY_TIME } from '../protocol/protocol-builder.constant';
import { formatRussianDateLong, formatRussianDateShort } from '../time/russian-date';
import {
  ABBREVIATION_DNF,
  ABBREVIATION_DSQ,
  ABBREVIATIONS_MARGIN,
  ABBREVIATIONS_TITLE,
  DNF_LABEL,
  EMPTY_CELL,
  EVENT_TITLE_PREFIX,
  FLEX_COLUMN_WIDTH,
  GENDER_LABELS,
  GROUP_COLUMN_SPAN,
  HEADER_ATHLETE,
  HEADER_CLUB,
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
  SIGNATURE_MARGIN,
  SIGNATURE_PREFIX,
  TABLE_HEADER_ROWS,
  TABLE_WIDTHS,
} from './protocol-doc-definition.constant';

/**
 * pdfmake document definition of the one-page A4 race protocol
 * (mirrors the reference TCPDF sample): page header, 'ПРОТОКОЛ' title,
 * justified intro, participants table, abbreviations and signature.
 */
export function buildProtocolDocDefinition(event: RaceEvent, rows: ProtocolRow[]): TDocumentDefinitions {
  return {
    pageSize: PDF_PAGE_SIZE,
    pageOrientation: PDF_PAGE_ORIENTATION,
    pageMargins: PDF_PAGE_MARGINS,
    defaultStyle: { font: PDF_FONT_FAMILY, fontSize: PDF_FONT_SIZE },
    content: [
      buildPageHeader(event),
      buildTitle(),
      buildIntro(event),
      buildParticipantsTitle(),
      buildParticipantsTable(rows),
      ...buildAbbreviations(),
      buildSignature(event),
    ],
  };
}

/** Left: long date; center: event name + city; right: park + club. */
function buildPageHeader(event: RaceEvent): ContentColumns {
  return {
    columns: [
      { width: FLEX_COLUMN_WIDTH, text: formatRussianDateLong(event.dateIso) },
      {
        width: FLEX_COLUMN_WIDTH,
        text: `${EVENT_TITLE_PREFIX}${formatRaceNumber(event.number, event.legacyNumber)}${LINE_BREAK}${event.city}`,
        alignment: PDF_ALIGN_CENTER,
      },
      { width: FLEX_COLUMN_WIDTH, text: `${event.park}${LINE_BREAK}${event.clubName}`, alignment: PDF_ALIGN_RIGHT },
    ],
  };
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

function buildParticipantsTable(rows: ProtocolRow[]): ContentTable {
  return {
    table: {
      headerRows: TABLE_HEADER_ROWS,
      widths: [...TABLE_WIDTHS],
      body: [...buildTableHeaderRows(), ...rows.map(buildTableBodyRow)],
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
      headerCell(HEADER_CLUB, { rowSpan: HEADER_ROW_SPAN }),
      headerCell(HEADER_NOTE, { rowSpan: HEADER_ROW_SPAN }),
    ],
    [{}, {}, headerCell(HEADER_TIME_23), headerCell(HEADER_TIME_5), {}, headerCell(HEADER_PLACE_M), headerCell(HEADER_PLACE_F), {}, {}],
  ];
}

function headerCell(text: string, spans: { rowSpan?: number; colSpan?: number } = {}): TableCell {
  return { text, bold: true, alignment: PDF_ALIGN_CENTER, ...spans };
}

/** Name, club and note are left-aligned; every numeric cell is centered. */
function buildTableBodyRow(row: ProtocolRow): TableCell[] {
  return [
    { text: String(row.index), alignment: PDF_ALIGN_CENTER },
    { text: row.fullName },
    { text: row.time23, alignment: PDF_ALIGN_CENTER },
    { text: isDnfRow(row) ? DNF_LABEL : row.time5, alignment: PDF_ALIGN_CENTER },
    { text: row.gender === null ? EMPTY_CELL : GENDER_LABELS[row.gender], alignment: PDF_ALIGN_CENTER },
    { text: row.placeM === null ? EMPTY_CELL : String(row.placeM), alignment: PDF_ALIGN_CENTER },
    { text: row.placeF === null ? EMPTY_CELL : String(row.placeF), alignment: PDF_ALIGN_CENTER },
    { text: row.club },
    { text: row.note },
  ];
}

/** The protocol builder emits DNF rows as the only rows without any recorded time. */
function isDnfRow(row: ProtocolRow): boolean {
  return row.time23 === EMPTY_TIME && row.time5 === EMPTY_TIME;
}

function buildAbbreviations(): ContentText[] {
  return [{ text: ABBREVIATIONS_TITLE, margin: ABBREVIATIONS_MARGIN }, { text: ABBREVIATION_DNF }, { text: ABBREVIATION_DSQ }];
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

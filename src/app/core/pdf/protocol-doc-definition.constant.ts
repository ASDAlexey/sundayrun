import type { Alignment, Margins, PageOrientation, PageSize, Size } from 'pdfmake/interfaces';
import { Gender, GenderType } from '../models/gender.enum';

export const PDF_PAGE_SIZE: PageSize = 'A4';

export const PDF_PAGE_ORIENTATION: PageOrientation = 'portrait';

/** [left, top, right, bottom] in points. */
export const PDF_PAGE_MARGINS: Margins = [40, 50, 40, 50];

export const PDF_FONT_FAMILY = 'PTSerif';

export const PDF_FONT_SIZE = 10;

export const PDF_ALIGN_CENTER: Alignment = 'center';

export const PDF_ALIGN_RIGHT: Alignment = 'right';

export const PDF_ALIGN_JUSTIFY: Alignment = 'justify';

/** Every page-header column takes an equal share of the page width. */
export const FLEX_COLUMN_WIDTH: Size = '*';

export const LINE_BREAK = '\n';

/** The header column is a third of the page, so «№ 105 (221)» is glued with non-breaking spaces — a wrap falls before the number, never inside it. */
export const NON_BREAKING_SPACE = '\u00a0';

export const EVENT_TITLE_PREFIX = `Воскресный парковый пробег №${NON_BREAKING_SPACE}`;

export const PROTOCOL_TITLE = 'ПРОТОКОЛ';

export const PROTOCOL_TITLE_MARGIN: Margins = [0, 24, 0, 12];

export const INTRO_BEFORE_PARK =
  'Настоящим сообщаю, что нижеперечисленные спортсмены и волонтеры приняли активное участие в организации и проведении Воскресного паркового пробега в ';

export const INTRO_PART_SEPARATOR = ', ';

export const INTRO_BEFORE_DATE = ', который проходил ';

/** First-line paragraph indent in points. */
export const INTRO_LEADING_INDENT = 24;

export const INTRO_MARGIN: Margins = [0, 12, 0, 12];

export const PARTICIPANTS_TITLE = 'Участники:';

export const PARTICIPANTS_TITLE_MARGIN: Margins = [0, 8, 0, 4];

export const HEADER_INDEX = '№';

export const HEADER_ATHLETE = 'Спортсмен (ФИ)';

export const HEADER_TIME = 'Время';

export const HEADER_TIME_23 = '2.3 км';

export const HEADER_TIME_5 = '5 км';

export const HEADER_GENDER = 'Пол';

export const HEADER_PLACE = 'Место';

export const HEADER_PLACE_M = 'М';

export const HEADER_PLACE_F = 'Ж';

export const HEADER_FINISHES = 'Участий за всё время';

export const HEADER_CLUB = 'Клуб';

export const HEADER_NOTE = 'Примечание';

/** 'Время' and 'Место' each span two sub-columns. */
export const GROUP_COLUMN_SPAN = 2;

/** Plain header cells span both header rows. */
export const HEADER_ROW_SPAN = 2;

/** Two-row table header repeated on every page. */
export const TABLE_HEADER_ROWS = 2;

/** №, athlete (flexible), 2.3 км, 5 км, пол, место М, место Ж, финишей, клуб, примечание. */
export const TABLE_WIDTHS: readonly Size[] = ['auto', '*', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto', 70, 110];

/** Display labels for the 'Пол' column. */
export const GENDER_LABELS: Record<GenderType, string> = {
  [Gender.male]: 'М',
  [Gender.female]: 'Ж',
};

/** Shown in the '5 км' cell of a non-finisher row. */
export const DNF_LABEL = 'DNF';

export const EMPTY_CELL = '';

export const ABBREVIATIONS_TITLE = 'Список сокращений:';

export const ABBREVIATION_DNF = 'DNF – участник не финишировал;';

export const ABBREVIATION_DSQ = 'DSQ – участник дисквалифицирован';

export const ABBREVIATIONS_MARGIN: Margins = [0, 16, 0, 0];

export const SIGNATURE_PREFIX = 'Председатель ';

export const SIGNATURE_MARGIN: Margins = [0, 48, 0, 0];

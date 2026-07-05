import { SourceFile } from '../../state/source-file.interface';

const PDF_BLOB_TEXT = '%PDF-1.7';

export const RESULT_BLOB_MOCK = new Blob([PDF_BLOB_TEXT]);

/** publish() re-reads the generated blob into bytes. */
export const EXPECTED_PDF_BYTES: Uint8Array = new TextEncoder().encode(PDF_BLOB_TEXT);

export const SOURCE_FILE_MOCK: SourceFile = { name: '20.09.2020.xlsx', bytes: new Uint8Array([4, 5, 6]) };

export const PUBLISHED_PDF_URL_MOCK = 'https://cdn.jsdelivr.net/gh/ASDAlexey/protocols@sha0/events/2020-09-20/protocol.pdf';

/** An http url instead of a real blob: one — jsdom cannot create iframe windows for opaque origins. */
export const OBJECT_URL_MOCK = 'https://parkrun.example/protokol.pdf';

export const FILE_NAME_MOCK = 'protokol-2020-09-20.pdf';

export const VK_URL_MOCK = 'https://vk.com/share.php?url=mock';

export const GENERATE_ERROR_MESSAGE = 'pdf generation failed';

/** composeRaceAnnouncement(PDF_EVENT_MOCK, PDF_ROWS_MOCK): the first line doubles as the share title. */
export const EXPECTED_TITLE_LINE = 'Воскресный парковый пробег № 160 — 20.09.2020 г.';

export const EXPECTED_DESCRIPTION = [
  EXPECTED_TITLE_LINE,
  'ПКиО им. Горького, г. Таганрог',
  'Участников: 3',
  'Победители: М — Хахуцкий Виктор (17:40), Ж — Фарафонова Екатерина (24:25)',
].join('\n');

export const EDITED_DESCRIPTION = 'Отредактированное описание репоста';

export const EXPECTED_SUMMARY = '№ 160 — 20 сентября 2020 г.';

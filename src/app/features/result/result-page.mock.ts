import { SourceFile } from '../../state/source-file.interface';

export const RESULT_BLOB_MOCK = new Blob(['%PDF-1.7']);

export const PROTOCOL_IMAGE_BLOB_MOCK = new Blob(['png-bytes'], { type: 'image/png' });

/** `FILE_NAME_MOCK` with the pdf extension swapped for png. */
export const EXPECTED_IMAGE_FILE_NAME = 'protokol-2020-09-20.png';

export const RUN_PHOTO_MOCK = new File(['photo-bytes'], 'zabeg.jpg', { type: 'image/jpeg' });

export const SOURCE_FILE_MOCK: SourceFile = { name: '20.09.2020.xlsx', bytes: new Uint8Array([4, 5, 6]) };

/** An http url instead of a real blob: one — jsdom cannot create iframe windows for opaque origins. */
export const OBJECT_URL_MOCK = 'https://parkrun.example/protokol.pdf';

export const FILE_NAME_MOCK = 'protokol-2020-09-20.pdf';

export const VK_URL_MOCK = 'https://vk.com/share.php?url=mock';

export const GENERATE_ERROR_MESSAGE = 'pdf generation failed';

export const FINISH_COUNTS_ERROR_MESSAGE = 'finish counts read failed';

/** `eventFinishCounts(PDF_ROWS_MOCK, {})`: both 5 km finishers debut, the one-lap and DNF rows stay out. */
export const EXPECTED_RESULT_FINISH_COUNTS: Record<string, number> = {
  'хахуцкий виктор': 1,
  'фарафонова екатерина': 1,
};

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

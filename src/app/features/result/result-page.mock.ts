import { PublishEventInput } from '../../core/github/publish-event.interface';
import { RaceEvent } from '../../core/models/race-event.interface';
import { PDF_EVENT_MOCK, PDF_ROWS_MOCK } from '../../core/pdf/protocol-doc-definition.mock';
import { SourceFile } from '../../state/source-file.interface';

export const RESULT_BLOB_MOCK = new Blob(['%PDF-1.7']);

export const PROTOCOL_IMAGE_BLOB_MOCK = new Blob(['png-bytes'], { type: 'image/png' });

/** `FILE_NAME_MOCK` with the pdf extension swapped for png. */
export const EXPECTED_IMAGE_FILE_NAME = 'protokol-2020-09-20.png';

export const RUN_PHOTO_MOCK = new File(['photo-bytes'], 'zabeg.jpg', { type: 'image/jpeg' });

export const SOURCE_FILE_MOCK: SourceFile = { name: '20.09.2020.xlsx', bytes: new Uint8Array([4, 5, 6]) };

/** The batch's second draft: the next event, a week after `PDF_EVENT_MOCK`. */
export const SECOND_EVENT_MOCK: RaceEvent = { ...PDF_EVENT_MOCK, number: 161, dateIso: '2020-09-27' };

export const SECOND_SOURCE_FILE_MOCK: SourceFile = { name: '27.09.2020.xlsx', bytes: new Uint8Array([7, 8, 9]) };

/** The two-draft batch as the store's `buildPublishInputs` hands it out; sliced to one for a single-draft flow. */
export const PUBLISH_INPUTS_BATCH_MOCK: PublishEventInput[] = [
  { event: PDF_EVENT_MOCK, rows: PDF_ROWS_MOCK, sourceXlsxBytes: SOURCE_FILE_MOCK.bytes },
  { event: SECOND_EVENT_MOCK, rows: PDF_ROWS_MOCK, sourceXlsxBytes: SECOND_SOURCE_FILE_MOCK.bytes },
];

/** An http url instead of a real blob: one — jsdom cannot create iframe windows for opaque origins. */
export const OBJECT_URL_MOCK = 'https://parkrun.example/protokol.pdf';

/** The second draft's preview url — destroy must revoke every cached one. */
export const SECOND_OBJECT_URL_MOCK = 'https://parkrun.example/protokol-2.pdf';

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

/** The announcement body shared by both drafts — they run the same `PDF_ROWS_MOCK` protocol. */
const DESCRIPTION_BODY = [
  'ПКиО им. Горького, г. Таганрог',
  'Участников: 3',
  'Победители: М — Хахуцкий Виктор (17:40), Ж — Фарафонова Екатерина (24:25)',
];

export const EXPECTED_DESCRIPTION = [EXPECTED_TITLE_LINE, ...DESCRIPTION_BODY].join('\n');

/** composeRaceAnnouncement(SECOND_EVENT_MOCK, PDF_ROWS_MOCK): only the title line differs. */
export const EXPECTED_SECOND_DESCRIPTION = ['Воскресный парковый пробег № 161 — 27.09.2020 г.', ...DESCRIPTION_BODY].join('\n');

export const EDITED_DESCRIPTION = 'Отредактированное описание репоста';

export const EXPECTED_SUMMARY = '№ 160 — 20 сентября 2020 г.';

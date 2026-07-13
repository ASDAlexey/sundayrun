import { PrNoteParts } from './pr-note.interface';
import { PreviousBest } from './previous-bests.interface';

export const PR_NOTE_PLAIN = 'ЛР (было 20:52)';

export const PR_NOTE_COMBINED = 'Дети; ЛР (было 20:52); Лучший результат 2025 г.';

export const PR_NOTE_WITHOUT_RECORD = 'Первое участие';

export const EXPECTED_PLAIN_PARTS: PrNoteParts = { before: 'ЛР (было ', time: '20:52', after: ')' };

export const EXPECTED_COMBINED_PARTS: PrNoteParts = {
  before: 'Дети; ЛР (было ',
  time: '20:52',
  after: '); Лучший результат 2025 г.',
};

export const PR_NOTE_PREVIOUS_BEST: PreviousBest = { slug: '2025-01-12', dateIso: '2025-01-12', timeMs: 1252000 };

export const EXPECTED_TIME_WITH_DATE = '20:52 · 12 янв 2025';

export const EXPECTED_DATED_PLAIN_NOTE = 'ЛР (было 20:52 · 12 янв 2025)';

export const EXPECTED_DATED_COMBINED_NOTE = 'Дети; ЛР (было 20:52 · 12 янв 2025); Лучший результат 2025 г.';

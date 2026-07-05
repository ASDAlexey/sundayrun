import { NEWER_ENTRY, OLDER_ENTRY } from '../../core/github/archive-index.mock';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { RaceListItem } from './races-page.interface';

/** EXISTING_INDEX events (newest first) mapped by toListItem: long dates, protocol routes and branch-pinned CDN urls. */
export const EXPECTED_RACE_ITEMS: RaceListItem[] = [
  {
    slug: '2026-07-05',
    protocolLink: [RACE_PAGE_BASE_LINK, '2026-07-05'],
    number: 13,
    dateLong: '5 июля 2026 г.',
    city: 'Курск',
    park: 'Боева дача',
    participantCount: 20,
    pdfUrl: 'https://cdn.jsdelivr.net/gh/ASDAlexey/sundayrun@main/data/events/2026-07-05/protocol.pdf',
    pdfAriaLabel: 'Протокол пробега № 13 (PDF)',
  },
  {
    slug: '2026-06-21',
    protocolLink: [RACE_PAGE_BASE_LINK, '2026-06-21'],
    number: 11,
    dateLong: '21 июня 2026 г.',
    city: 'Курск',
    park: 'Боева дача',
    participantCount: 15,
    pdfUrl: 'https://cdn.jsdelivr.net/gh/ASDAlexey/sundayrun@main/data/events/2026-06-21/protocol.pdf',
    pdfAriaLabel: 'Протокол пробега № 11 (PDF)',
  },
];

export const EXPECTED_RACE_TITLES = ['Пробег № 13', 'Пробег № 11'];

export const INDEX_LOAD_ERROR_MESSAGE = 'index load failed';

/** EXISTING_SITE_META.startTime rendered through the @@races.startTime template. */
export const EXPECTED_ANNOUNCE_TIME_TEXT = 'Каждое воскресенье · старт в 08:00';

/** OLDER_ENTRY moved a year back, so the list spans two distinct years for the filter. */
export const PREVIOUS_YEAR_INDEX = {
  schemaVersion: 1,
  events: [
    NEWER_ENTRY,
    {
      ...OLDER_ENTRY,
      slug: '2025-06-21',
      dateIso: '2025-06-21',
      files: {
        sourceXlsx: 'data/events/2025-06-21/source.xlsx',
        protocolPdf: 'data/events/2025-06-21/protocol.pdf',
        resultsJson: 'data/events/2025-06-21/results.json',
      },
    },
  ],
} as const;

export const EXPECTED_YEARS = ['2026', '2025'];

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
    pdfUrl: 'https://cdn.jsdelivr.net/gh/ASDAlexey/protocols@main/events/2026-07-05/protocol.pdf',
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
    pdfUrl: 'https://cdn.jsdelivr.net/gh/ASDAlexey/protocols@main/events/2026-06-21/protocol.pdf',
    pdfAriaLabel: 'Протокол пробега № 11 (PDF)',
  },
];

export const EXPECTED_RACE_TITLES = ['Пробег № 13', 'Пробег № 11'];

export const INDEX_LOAD_ERROR_MESSAGE = 'index load failed';

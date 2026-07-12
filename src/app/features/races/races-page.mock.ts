import { NEWER_ENTRY, OLDER_ENTRY } from '../../core/github/archive-index.mock';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { RaceListItem } from './races-page.interface';

/** EXISTING_INDEX events (newest first) mapped by toListItem: long dates, protocol routes and pdf button labels. */
export const EXPECTED_RACE_ITEMS: RaceListItem[] = [
  {
    slug: '2026-07-05',
    protocolLink: [RACE_PAGE_BASE_LINK, '2026-07-05'],
    number: '13',
    dateLong: '5 июля 2026 г.',
    city: 'Курск',
    park: 'Боева дача',
    participantCount: 20,
    stats: [
      { label: 'Финишёров 5 км', value: '18' },
      { label: 'Медиана', value: '31:02' },
      { label: 'Лучшее М', value: '17:36' },
      { label: 'Лучшее Ж', value: '20:38' },
      { label: 'Новичка', value: '3' },
      { label: 'Личных рекорда', value: '2' },
    ],
    pdfAriaLabel: 'Протокол пробега № 13 (PDF)',
  },
  {
    slug: '2026-06-21',
    protocolLink: [RACE_PAGE_BASE_LINK, '2026-06-21'],
    number: '11',
    dateLong: '21 июня 2026 г.',
    city: 'Курск',
    park: 'Боева дача',
    participantCount: 15,
    stats: [
      { label: 'Финишёров 5 км', value: '12' },
      { label: 'Медиана', value: '29:13' },
      { label: 'Лучшее М', value: '19:43' },
      { label: 'Лучшее Ж', value: '22:40' },
      // A zero record count builds no chip; the single newcomer takes the one-form label.
      { label: 'Новичок', value: '1' },
    ],
    pdfAriaLabel: 'Протокол пробега № 11 (PDF)',
  },
];

export const EXPECTED_RACE_TITLES = ['Пробег № 13', 'Пробег № 11'];

/** A one-card baked payload, distinct from the two-card network answer, to make the refresh visible. */
export const BAKED_RACE_ITEMS: RaceListItem[] = [EXPECTED_RACE_ITEMS[1]];

export const INDEX_LOAD_ERROR_MESSAGE = 'index load failed';

/** EXISTING_SITE_META.startTime rendered through the @@races.startTime template. */
export const EXPECTED_ANNOUNCE_TIME_TEXT = 'Каждое воскресенье · старт в 08:00';

/**
 * OLDER_ENTRY moved a year back, so the list spans two distinct years for the filter.
 * Its aggregates are nulled to render one card entirely without stat chips.
 */
export const PREVIOUS_YEAR_INDEX = {
  schemaVersion: 1,
  events: [
    NEWER_ENTRY,
    {
      ...OLDER_ENTRY,
      slug: '2025-06-21',
      dateIso: '2025-06-21',
      finisherCount: null,
      medianTimeMs: null,
      bestMaleMs: null,
      bestFemaleMs: null,
      newcomerCount: null,
      personalRecordCount: null,
      files: {
        sourceXlsx: 'data/events/2025-06-21/source.xlsx',
        resultsJson: 'data/events/2025-06-21/results.json',
      },
    },
  ],
} as const;

export const EXPECTED_YEARS = ['2026', '2025'];

import { NEWER_ENTRY, OLDER_ENTRY } from '../../core/github/archive-index.mock';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { RaceListItem } from './races-page.interface';

/** The frozen «today» the page specs pin `isoToday` to: July is still open, June is closed. */
export const RACES_TODAY_ISO = '2026-07-12';

/**
 * EXISTING_INDEX events (newest first) mapped by toRaceListItem: date chips, protocol routes,
 * the dynamics charts over the two-race window and the М/Ж times blocks.
 */
export const EXPECTED_RACE_ITEMS: RaceListItem[] = [
  {
    slug: '2026-07-05',
    protocolLink: [RACE_PAGE_BASE_LINK, '2026-07-05'],
    number: '13',
    numberTooltip: null,
    dateText: 'вс · 5 июл 2026',
    // The latest race of the still-open month is not the final yet.
    isMonthFinal: false,
    hero: {
      value: '18',
      label: 'финишёров · 5 км',
      // The window holds both races, oldest first; 18 tops it, so the caption celebrates.
      trend: {
        bars: [
          { heightPercent: 67, isCurrent: false, count: 12 },
          { heightPercent: 100, isCurrent: true, count: 18 },
        ],
        highlightText: 'максимум серии',
      },
      stats: [
        { value: '3', label: 'новичка', isZero: false, hasArrow: false },
        { value: '2', label: 'личных рекорда', isZero: false, hasArrow: true },
      ],
    },
    genders: [
      { title: 'М · мужчины', best: '17:36', median: '30:10' },
      { title: 'Ж · женщины', best: '20:38', median: '33:04' },
    ],
    // NEWER_ENTRY's stored reading: mostly-clear icon, +25° rounded and the 9 km/h wind.
    weatherText: '🌤️ +25°, ветер 9 км/ч',
    pdfAriaLabel: 'Протокол пробега № 13 (PDF)',
  },
  {
    slug: '2026-06-21',
    protocolLink: [RACE_PAGE_BASE_LINK, '2026-06-21'],
    number: '11',
    numberTooltip: null,
    dateText: 'вс · 21 июн 2026',
    // The last June race against the frozen July «today» — the month's final.
    isMonthFinal: true,
    hero: {
      value: '12',
      label: 'финишёров · 5 км',
      // The oldest race sees no earlier entries: a one-bar window it trivially tops.
      trend: {
        bars: [{ heightPercent: 100, isCurrent: true, count: 12 }],
        highlightText: 'максимум серии',
      },
      stats: [
        { value: '1', label: 'новичок', isZero: false, hasArrow: false },
        // A zero record count stays on the card, dimmed.
        { value: '0', label: 'личных рекордов', isZero: true, hasArrow: true },
      ],
    },
    genders: [
      { title: 'М · мужчины', best: '19:43', median: '28:41' },
      { title: 'Ж · женщины', best: '22:40', median: '30:46' },
    ],
    // OLDER_ENTRY predates the weather fetch, so its card carries no weather line.
    weatherText: '',
    pdfAriaLabel: 'Протокол пробега № 11 (PDF)',
  },
];

export const EXPECTED_RACE_TITLES = ['№ 13', '№ 11'];

/** A one-card baked payload, distinct from the two-card network answer, to make the refresh visible. */
export const BAKED_RACE_ITEMS: RaceListItem[] = [EXPECTED_RACE_ITEMS[1]];

export const INDEX_LOAD_ERROR_MESSAGE = 'index load failed';

/**
 * OLDER_ENTRY moved a year back, so the list spans two distinct years for the filter.
 * Its aggregates are nulled to render one card with a participants-only hero.
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
      medianMaleMs: null,
      medianFemaleMs: null,
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

import { ArchiveIndexEntry } from '../../core/github/archive-index.interface';
import { EXPECTED_NO_FINISHER_ENTRY, NEWER_ENTRY } from '../../core/github/archive-index.mock';
import { RaceCardGenderBlock, RaceCardHero, RaceCardTrend } from './races-page.interface';

/** A frozen «today» well past the fixture month, so its finality never depends on the calendar. */
export const EDGE_CASES_TODAY_ISO = '2026-09-01';

/** A published event whose counts predate the newcomer/record notes: the nulls take the `?? 0` paths. */
export const NOTELESS_ENTRY: ArchiveIndexEntry = {
  ...EXPECTED_NO_FINISHER_ENTRY,
  finisherCount: 2,
  newcomerCount: null,
  personalRecordCount: null,
};

/** EXPECTED_NO_FINISHER_ENTRY alone: zero finishers make a flat one-bar chart that never celebrates. */
export const EXPECTED_RECORDLESS_HERO: RaceCardHero = {
  value: '0',
  label: 'финишёров · 5 км',
  trend: {
    bars: [{ heightPercent: 0, isCurrent: true, count: 0 }],
    highlightText: 'этот забег',
  },
  stats: [
    { value: '0', label: 'новичков', isZero: true, hasArrow: false },
    { value: '0', label: 'личных рекордов', isZero: true, hasArrow: true },
  ],
};

/** NEWER_ENTRY under the organisers' old numbering — the card number grows the «new vs old» tooltip. */
export const LEGACY_NUMBERED_ENTRY: ArchiveIndexEntry = { ...NEWER_ENTRY, legacyNumber: '2.72' };

export const EXPECTED_LEGACY_NUMBER_TOOLTIP = 'Новая нумерация — № 13, старая — 2.72';

/** NOTELESS_ENTRY a week after NEWER_ENTRY, newest first: two finishers against the window's 18 — a decline. */
export const DECLINE_ENTRIES: ArchiveIndexEntry[] = [{ ...NOTELESS_ENTRY, slug: '2026-07-12', dateIso: '2026-07-12' }, NEWER_ENTRY];

/** The decline card's chart: the older 18 towers over the own bar, so the caption stays plain. */
export const EXPECTED_DECLINE_TREND: RaceCardTrend = {
  bars: [
    { heightPercent: 100, isCurrent: false, count: 18 },
    { heightPercent: 11, isCurrent: true, count: 2 },
  ],
  highlightText: 'этот забег',
};

/** EXPECTED_NEW_ENTRY's М/Ж block: the sole finisher is a woman, so the men's block drops out. */
export const EXPECTED_FEMALE_ONLY_GENDERS: RaceCardGenderBlock[] = [{ title: 'Ж · женщины', best: '25:00', median: '25:00' }];

/** NOTELESS_ENTRY alone: the null note counters fall back to dimmed zeros instead of vanishing. */
export const EXPECTED_NOTELESS_HERO: RaceCardHero = {
  value: '2',
  label: 'финишёра · 5 км',
  trend: {
    bars: [{ heightPercent: 100, isCurrent: true, count: 2 }],
    highlightText: 'максимум серии',
  },
  stats: [
    { value: '0', label: 'новичков', isZero: true, hasArrow: false },
    { value: '0', label: 'личных рекордов', isZero: true, hasArrow: true },
  ],
};

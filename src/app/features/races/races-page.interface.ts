/** One bar of the dynamics chart: height as a percent of the window's busiest race. */
export interface RaceCardTrendBar {
  heightPercent: number;
  /** The card's own race — the accent bar at the right edge of the chart. */
  isCurrent: boolean;
  /** The finisher count behind the bar — the instant hover bubble over it. */
  count: number;
}

/** The finisher-count dynamics chart under the hero figure: this race and up to 7 preceding ones. */
export interface RaceCardTrend {
  /** Oldest race first, the card's own race last. */
  bars: RaceCardTrendBar[];
  /** The accent tail of the caption: 'максимум серии' when this race tops the window, else 'этот забег'. */
  highlightText: string;
}

/** One row of the hero side column: newcomers or personal records, zero included. */
export interface RaceCardSideStat {
  value: string;
  label: string;
  /** Zero counts render dimmed instead of disappearing. */
  isZero: boolean;
  /** The personal-records row carries the ↑ arrow. */
  hasArrow: boolean;
}

/** The hero block of a card: the big count with the dynamics chart and side stats beside it. */
export interface RaceCardHero {
  /** The big figure: 5 km finishers, or all participants on an entry that predates the aggregates. */
  value: string;
  /** Pluralized label over the chart: 'финишёров · 5 км' or 'участников'. */
  label: string;
  /** Null while the entry (or the whole archive) has no known finisher counts. */
  trend: RaceCardTrend | null;
  /** Newcomers and personal records; empty on an entry that predates the aggregates. */
  stats: RaceCardSideStat[];
}

/** One gender column of the times block: 'М · мужчины' over the best and median 5 km times. */
export interface RaceCardGenderBlock {
  title: string;
  /** '20:59'; a null row is hidden instead of rendering a dash. */
  best: string | null;
  median: string | null;
}

/** One race row prepared for the template: the hero block, the gender times and the protocol links. */
export interface RaceListItem {
  slug: string;
  protocolLink: string[];
  /** The positional number for the card title. */
  number: string;
  /** «New vs old numbering» tooltip on the number; null when the race predates no legacy number. */
  numberTooltip: string | null;
  /** Preformatted date chip: 'вс · 5 июл 2026'. */
  dateText: string;
  /** True for the month-final («итоговый») race — the card gets the accent badge and outline. */
  isMonthFinal: boolean;
  hero: RaceCardHero;
  /** The М/Ж times block; a gender without any known time is dropped, an empty block hides entirely. */
  genders: RaceCardGenderBlock[];
  /** «☀️ +26°, ветер 10 км/ч» — the stored course weather; empty when the race has none, then hidden. */
  weatherText: string;
  pdfAriaLabel: string;
}

/** One season section of the archive: a year divider («2026 · 8 забегов») over its cards. */
export interface RaceYearGroup {
  year: string;
  countText: string;
  races: RaceListItem[];
}

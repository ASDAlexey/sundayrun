/** The athlete's most negative split, dated and linked to its race. */
export interface PacingBestView {
  /** «на 3% быстрее» — how much faster the second lap paced that day. */
  deltaText: string;
  dateShort: string;
  raceLink: string[];
}

/** The «Раскладка» card prepared for the template; null hides the card. */
export interface PacingCardView {
  /** The archetype headline: разгоняется / ровно / быстрый старт. */
  profileText: string;
  /** «на 7% медленнее» / «на 2% быстрее» / «вровень с первым» — the median second-lap pace delta. */
  medianDeltaText: string;
  /** «2 из 34» — negative splits over the split-bearing runs. */
  negativeCountText: string;
  /** The most negative split; null while the athlete never ran one. */
  best: PacingBestView | null;
}

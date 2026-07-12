/** routerLink to the all-time best results page, linked from the header navigation. */
export const RECORDS_PAGE_LINK = '/records';

/** Fixed leaderboard row height; `.records__row` in SCSS must stay in sync. */
export const RECORDS_ROW_HEIGHT_PX = 52;

/** Top places that get the podium highlight (gradient rank + tinted row). */
export const RECORDS_PODIUM_SIZE = 3;

/** The gender toggle value that disables filtering (a toggle cannot carry `null`). */
export const ALL_GENDERS_VALUE = 'all';

/** The crown labels of the current record holders; the year view shortens to «Король 2024». */
export const KING_ALL_TIME_TEXT = $localize`:@@records.kingAllTime:Король трассы`;

export const QUEEN_ALL_TIME_TEXT = $localize`:@@records.queenAllTime:Королева трассы`;

export const KING_YEAR_PREFIX = $localize`:@@records.kingYear:Король`;

export const QUEEN_YEAR_PREFIX = $localize`:@@records.queenYear:Королева`;

/** Prepended to the formatted gain of each record-beating run («−0:12»). */
export const RECORD_DELTA_SIGN = '−';

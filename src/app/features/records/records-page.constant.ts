import { RecordsView } from './records-page.enum';

/** routerLink to the all-time best results page, linked from the header navigation. */
export const RECORDS_PAGE_LINK = '/records';

/** `/records?view=chart` opens the page straight on the season race. */
export const RECORDS_VIEW_QUERY_PARAM = 'view';

export const RECORDS_CHART_QUERY_PARAMS = { [RECORDS_VIEW_QUERY_PARAM]: RecordsView.chart };

/** `/records?view=rating` opens the page straight on the combined М+Ж rating board. */
export const RECORDS_RATING_QUERY_PARAMS = { [RECORDS_VIEW_QUERY_PARAM]: RecordsView.rating };

/** The dash a rating row without an own-gender course record grades on. */
export const NO_GRADE_TEXT = '—';

/** TransferState key of the prerendered boards payload (the `ng-state` script). */
export const RECORDS_TRANSFER_KEY = 'records.data';

/** The season-race «find yourself» dropdown never suggests more names at once. */
export const CHART_SUGGESTION_LIMIT = 8;

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

/** The weather extreme card labels; the year filter scopes the scan, so the labels stay timeless. */
export const WEATHER_COLDEST_LABEL = $localize`:@@records.weatherColdest:Самый холодный`;

export const WEATHER_HOTTEST_LABEL = $localize`:@@records.weatherHottest:Самый жаркий`;

export const WEATHER_WINDIEST_LABEL = $localize`:@@records.weatherWindiest:Самый ветреный`;

/** The wind record card leads with the reading itself: «💨 32 км/ч». */
export const WINDIEST_VALUE_ICON = '💨';

import { Season, SeasonType } from '../../core/history/seasons.enum';
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

/** The season toggle value that disables filtering, like `ALL_GENDERS_VALUE`. */
export const ALL_SEASONS_VALUE = 'all';

/** The season filter chips in calendar order; shown once a specific year is chosen. */
export const SEASON_FILTER_OPTIONS: readonly { value: SeasonType; label: string }[] = [
  { value: Season.winter, label: $localize`:@@records.seasonWinter:Зима` },
  { value: Season.spring, label: $localize`:@@records.seasonSpring:Весна` },
  { value: Season.summer, label: $localize`:@@records.seasonSummer:Лето` },
  { value: Season.autumn, label: $localize`:@@records.seasonAutumn:Осень` },
];

/** The genitive season names the crown labels are built from: «Король лета 2026». */
export const SEASON_GENITIVE_LABELS: Record<SeasonType, string> = {
  [Season.winter]: $localize`:@@records.seasonOfWinter:зимы`,
  [Season.spring]: $localize`:@@records.seasonOfSpring:весны`,
  [Season.summer]: $localize`:@@records.seasonOfSummer:лета`,
  [Season.autumn]: $localize`:@@records.seasonOfAutumn:осени`,
};

/** Prepended to the formatted gain of each record-beating run («−0:12»). */
export const RECORD_DELTA_SIGN = '−';

/** The weather extreme card labels; the year filter scopes the scan, so the labels stay timeless. */
export const WEATHER_COLDEST_LABEL = $localize`:@@records.weatherColdest:Самый холодный`;

export const WEATHER_HOTTEST_LABEL = $localize`:@@records.weatherHottest:Самый жаркий`;

export const WEATHER_WINDIEST_LABEL = $localize`:@@records.weatherWindiest:Самый ветреный`;

/** The wind record card leads with the reading itself: «💨 32 км/ч». */
export const WINDIEST_VALUE_ICON = '💨';

/** The pacing nomination card labels, per gender; the year filter scopes the scan. */
export const EVENEST_MALE_LABEL = $localize`:@@records.evenestMale:Самый ровный бегун`;

export const EVENEST_FEMALE_LABEL = $localize`:@@records.evenestFemale:Самая ровная бегунья`;

export const SECOND_HALF_MALE_LABEL = $localize`:@@records.secondHalfMale:Король второго круга`;

export const SECOND_HALF_FEMALE_LABEL = $localize`:@@records.secondHalfFemale:Королева второго круга`;

/** The evenness deviation renders as «±1,2%»: whole percents with one decimal, comma-separated. */
export const PACING_PERCENT_BASE = 100;

export const PACING_DEVIATION_DECIMALS = 1;

export const DECIMAL_COMMA = ',';

export const PACING_DEVIATION_PREFIX = '±';

/** Leads the second-half charger's tally: «+12 мест». */
export const PACING_GAIN_PREFIX = '+';

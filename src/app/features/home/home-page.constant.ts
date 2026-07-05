/** Four fills the two-column preview grid evenly (2×2). */
export const LATEST_RACES_COUNT = 4;

export const RACES_PAGE_LINK = '/races';

/** TransferState keys of the prerendered home payloads (the `ng-state` script). */
export const HOME_RACES_TRANSFER_KEY = 'home.latestRaces';

export const HOME_META_TRANSFER_KEY = 'home.siteMeta';

export const HOME_STATS_TRANSFER_KEY = 'home.stats';

/** Site-wide totals are grouped the Russian way: '12 345'. */
export const STATS_NUMBER_FORMAT = new Intl.NumberFormat('ru-RU');

/** The average finishes per participant always keeps one decimal: '8,8'. */
export const STATS_AVERAGE_FORMAT = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

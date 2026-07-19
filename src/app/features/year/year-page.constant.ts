/** Base of the year review pages (`/year/:year`), linked from the header navigation. */
export const YEAR_PAGE_BASE_LINK = '/year';

export const YEAR_ROUTE_PARAM = 'year';

/** TransferState key prefix; each prerendered review bakes under `year.review.<year>`. */
export const YEAR_TRANSFER_KEY_PREFIX = 'year.review.';

/** The key suffix of the parameterless `/year`, whose review is the newest season. */
export const YEAR_LATEST_KEY = 'latest';

/** Top places that get the podium highlight on the year boards, mirroring the records page. */
export const YEAR_PODIUM_SIZE = 3;

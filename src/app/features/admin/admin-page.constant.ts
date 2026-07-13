import { FIRST_ARCHIVE_EVENT_NUMBER } from '../../core/github/archive-index.constant';

/** routerLink to the organiser sign-in page. */
export const ADMIN_PAGE_LINK = '/admin';

/** A blank (or whitespace-only) input never reaches the network. */
export const EMPTY_TOKEN = '';

/** The step-by-step PAT guide in the app repository, opened from the sign-in card. */
export const TOKEN_HELP_URL = 'https://github.com/ASDAlexey/sundayrun/blob/main/docs/ADMIN_TOKEN.md';

/** Prefix of the public race page, joined with the event slug for the «протокол» link. */
export const RACE_PAGE_PREFIX = '/races/';

/** `max()` seed one below the first number, so an empty archive suggests № 1. */
export const NEXT_NUMBER_SEED = FIRST_ARCHIVE_EVENT_NUMBER - 1;

/** A blank query shows the full race list without filtering. */
export const EMPTY_QUERY = '';

/** Shown in the announcement preview until a start time is picked. */
export const TIME_PLACEHOLDER = '—';

/**
 * Fixed height of one race row; the virtual scroll strategy assumes this exact
 * value, and `.admin__race` in the stylesheet must stay in sync with it.
 */
export const ADMIN_RACE_ROW_HEIGHT_PX = 64;

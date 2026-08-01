/** One protocol row per line; a blank line separates the groups. */
export const SHARE_LINE_SEPARATOR = '\n';
export const SHARE_GROUP_SEPARATOR = '\n\n';

/** «1. Троилин Антон — 19:03,03» — the dash a chat renders as a dash, not a hyphen. */
export const SHARE_PLACE_SUFFIX = '. ';
export const SHARE_NAME_TIME_SEPARATOR = ' — ';

/** Places are printed from one; the same base the protocol itself numbers rows with. */
export const SHARE_FIRST_PLACE = 1;

/** An empty group prints nothing at all — not a heading over a blank space. */
export const SHARE_EMPTY_GROUP = 0;

/** The 5 km distance a row carries when it is a full finish, and the one-lap distance beside it. */
export const SHARE_FIVE_KM = 5;

/** Nothing to append when the measurement has never been published. */
export const SHARE_NO_LINK = null;

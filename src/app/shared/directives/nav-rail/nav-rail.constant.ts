/**
 * The current item of a rail, as `RouterLinkActive` marks it via `ariaCurrentWhenActive`.
 * Reading the ARIA state instead of a styling class keeps the directive free of shell CSS.
 */
export const NAV_RAIL_ACTIVE_SELECTOR = '[aria-current]';

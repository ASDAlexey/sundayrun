import { DurationHistoryStorage } from './duration-history.type';

/** Enough history for a stable average while old CI timings age out quickly. */
export const DURATION_HISTORY_MAX_ENTRIES = 10;

/** Prerender has no localStorage; a stub of the used subset lets the server render the shell. */
export const DURATION_HISTORY_SSR_NOOP_STORAGE: DurationHistoryStorage = {
  getItem: () => null,
  setItem: () => undefined,
};

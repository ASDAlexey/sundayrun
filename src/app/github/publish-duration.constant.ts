import { PublishDurationStorage } from './publish-duration.type';

/** localStorage key of the recent click-to-live publish durations (a JSON number array, ms). */
export const PUBLISH_DURATIONS_STORAGE_KEY = 'parkrun.publish-durations';

/** Enough history for a stable average while old CI timings age out quickly. */
export const PUBLISH_DURATIONS_MAX_ENTRIES = 10;

/** Prerender has no localStorage; a stub of the used subset lets the server render the shell. */
export const PUBLISH_DURATION_SSR_NOOP_STORAGE: PublishDurationStorage = {
  getItem: () => null,
  setItem: () => undefined,
};

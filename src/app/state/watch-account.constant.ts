import { SelfAthleteStorage } from './self-athlete.type';

/** localStorage key of the linked watch account — token and region, never a password. */
export const WATCH_ACCOUNT_STORAGE_KEY = 'parkrun.watch-account';

/** Prerender has no localStorage; nobody is linked on the server, so the used subset suffices. */
export const WATCH_SSR_NOOP_STORAGE: SelfAthleteStorage = {
  getItem: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};

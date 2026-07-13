import { SelfAthleteStorage } from './self-athlete.type';

/** localStorage key of the visitor's own athlete pick («Выбери себя»). */
export const SELF_ATHLETE_STORAGE_KEY = 'parkrun.self-athlete';

/** Prerender has no localStorage; the server never knows the visitor, so a stub of the used subset suffices. */
export const SELF_SSR_NOOP_STORAGE: SelfAthleteStorage = {
  getItem: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};

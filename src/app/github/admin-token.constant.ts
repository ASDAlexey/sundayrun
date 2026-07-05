import { AdminTokenStorage } from './admin-token.type';

/** localStorage key of the organiser's fine-grained GitHub PAT. */
export const ADMIN_TOKEN_STORAGE_KEY = 'parkrun.github-token';

/** Prerender has no localStorage; the server never holds a token, so a stub of the used subset suffices. */
export const SSR_NOOP_STORAGE: AdminTokenStorage = {
  getItem: () => null,
  removeItem: () => undefined,
  setItem: () => undefined,
};

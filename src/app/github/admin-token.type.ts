/** The subset of the Storage API the token service uses; lets prerender run on a tiny stub. */
export type AdminTokenStorage = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

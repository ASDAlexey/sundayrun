/** The subset of the Storage API the self-athlete service uses; lets prerender run on a tiny stub. */
export type SelfAthleteStorage = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

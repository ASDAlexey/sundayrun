/** The subset of the Storage API the delta-base service uses; lets prerender run on a tiny stub. */
export type DeltaBaseStorage = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

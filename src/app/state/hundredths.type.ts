/** The subset of the Storage API the hundredths service uses; lets prerender run on a tiny stub. */
export type HundredthsStorage = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

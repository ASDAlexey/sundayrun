/** The subset of the Storage API a duration history uses; lets prerender run on a tiny stub. */
export type DurationHistoryStorage = Pick<Storage, 'getItem' | 'setItem'>;

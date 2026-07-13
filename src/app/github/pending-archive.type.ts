/** The subset of the Storage API the pending-archive service uses; lets prerender run on a tiny stub. */
export type PendingArchiveStorage = Pick<Storage, 'getItem' | 'removeItem' | 'setItem'>;

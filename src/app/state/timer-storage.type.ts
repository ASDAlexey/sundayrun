/** The subset of the Storage API the timer services use; lets prerender run on a tiny stub. */
export type TimerStorage = Pick<Storage, 'getItem' | 'setItem'>;

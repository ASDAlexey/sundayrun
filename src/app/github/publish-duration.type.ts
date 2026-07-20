/** The subset of the Storage API the publish-duration service uses; lets prerender run on a tiny stub. */
export type PublishDurationStorage = Pick<Storage, 'getItem' | 'setItem'>;

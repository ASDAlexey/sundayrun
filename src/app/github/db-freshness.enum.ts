/** What the shell banner knows about the deployed db relative to the published data commit. */
export const DbFreshness = {
  /** The pinned db is served (or nothing suggests otherwise) — no banner. */
  Fresh: 'fresh',
  /** A publication outran its deploy: the session reads the previous data while it lands. */
  Updating: 'updating',
  /** The fresh db landed while the session was on the old copy — offer a reload. */
  Updated: 'updated',
} as const;

export type DbFreshnessType = (typeof DbFreshness)[keyof typeof DbFreshness];

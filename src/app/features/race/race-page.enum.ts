export const RaceStatus = {
  loading: 'loading',
  ready: 'ready',
  notFound: 'notFound',
  error: 'error',
} as const;

export type RaceStatusType = (typeof RaceStatus)[keyof typeof RaceStatus];

/** The kinds of note tokens the protocol renders as icon badges; `plain` stays running text. */
export const RaceNoteBadgeKind = {
  record: 'record',
  yearBest: 'yearBest',
  debut: 'debut',
  kids: 'kids',
  status: 'status',
  plain: 'plain',
} as const;

export type RaceNoteBadgeKindType = (typeof RaceNoteBadgeKind)[keyof typeof RaceNoteBadgeKind];

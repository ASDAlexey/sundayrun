/** The kinds of note tokens the protocol renders as icon badges; `plain` stays running text. */
export const NoteBadgeKind = {
  record: 'record',
  yearBest: 'yearBest',
  debut: 'debut',
  kids: 'kids',
  status: 'status',
  plain: 'plain',
} as const;

export type NoteBadgeKindType = (typeof NoteBadgeKind)[keyof typeof NoteBadgeKind];

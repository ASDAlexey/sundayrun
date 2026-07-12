export const NotableKind = {
  allTimeRank: 'allTimeRank',
  windowBest: 'windowBest',
} as const;

export type NotableKindType = (typeof NotableKind)[keyof typeof NotableKind];

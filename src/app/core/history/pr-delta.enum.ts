/** Which side of the personal record a result landed on; `equal` is the exact repeat of it. */
export const PrDeltaKind = {
  faster: 'faster',
  slower: 'slower',
  equal: 'equal',
} as const;

export type PrDeltaKindType = (typeof PrDeltaKind)[keyof typeof PrDeltaKind];

/**
 * Where a result landed against the athlete's own recent form. Three of the four are the corridor's
 * sides; `afterBreak` is the row where the question itself is void — the form behind it is too old
 * to be a yardstick, so the cell says so in words instead of naming a figure.
 */
export const FormDeltaKind = {
  faster: 'faster',
  usual: 'usual',
  slower: 'slower',
  afterBreak: 'afterBreak',
} as const;

export type FormDeltaKindType = (typeof FormDeltaKind)[keyof typeof FormDeltaKind];

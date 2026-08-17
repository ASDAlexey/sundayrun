/**
 * What the protocol's delta column measures a finish against («Настройки» in the header).
 *
 * `form` — the runner's own recent median, the default; `year` — their best this season; `record` —
 * the all-time record standing before the race, which is what the column used to be and nothing
 * else; `off` — no column at all, for a reader who came to read times and places.
 */
export const DeltaBase = {
  form: 'form',
  year: 'year',
  record: 'record',
  off: 'off',
} as const;

export type DeltaBaseType = (typeof DeltaBase)[keyof typeof DeltaBase];

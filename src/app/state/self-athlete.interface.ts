/** The visitor's own athlete, picked once in the header and remembered on this device. */
export interface SelfAthlete {
  /** Normalized athlete key — the id of the personal page and history lookups. */
  key: string;
  displayName: string;
}

/** One event's finisher tally split by gender — the denominator of the athlete-page «3/22» place cell. */
export interface EventGenderFinishers {
  /** Finishers ranked in the men's column (a non-null `place_m`). */
  male: number;
  /** Finishers ranked in the women's column (a non-null `place_f`). */
  female: number;
}

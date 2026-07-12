/** The athlete's protocol places split by race kind: monthly finals vs regular races. */
export interface AthletePlacements {
  /** The best (lowest) place ever taken at a monthly final; null until the athlete finished one. */
  bestFinalPlace: number | null;
  /** The best place taken at a regular (non-final) race. */
  bestRegularPlace: number | null;
  /** How many monthly finals ended in a win. */
  firstFinalCount: number;
  /** How many monthly finals ended on the second step. */
  secondFinalCount: number;
  /** How many monthly finals ended on the third step. */
  thirdFinalCount: number;
}

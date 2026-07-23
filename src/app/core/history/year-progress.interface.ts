/** One row of the «Прогресс года» board: an athlete whose season median beat last season's. */
export interface YearProgressRow {
  key: string;
  displayName: string;
  /** The 5 km median of the previous season, ms. */
  previousMedianMs: number;
  /** The 5 km median of the reviewed season, ms — always below `previousMedianMs`. */
  currentMedianMs: number;
  /** The improvement `previousMedianMs − currentMedianMs`, ms — the board's ranking key. */
  deltaMs: number;
}

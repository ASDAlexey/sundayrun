/** One meme benchmark: a famous person (or beast) with a 5 km-equivalent time to beat. */
export interface MemeThreshold {
  key: string;
  /** «Гордон Рамзи» — who holds the benchmark. */
  name: string;
  /** «темп его марафона 3:30:37 (Лондон, 2004)» — where the time comes from. */
  note: string;
  /** The benchmark converted to a 5 km equivalent, comparable with the athlete's best. */
  timeMs: number;
}

/** One benchmark measured against the athlete's 5 km personal best. */
export interface MemeStanding extends MemeThreshold {
  /** The athlete's best is strictly faster than the benchmark — «быстрее X». */
  isBeaten: boolean;
  /** The slowest unbeaten benchmark — the one the card points at with the remaining gap. */
  isNext: boolean;
  /** What is left to beat the benchmark; 0 once beaten. */
  gapMs: number;
}

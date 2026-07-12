/** Aggregated counters of one race protocol for the parkrun-style summary line. */
export interface RaceSummary {
  /** Rows with a recorded time — 5 km and one-lap runners; DNF excluded. */
  finisherCount: number;
  /** Rows whose note carries the 'Первое участие' token. */
  newcomerCount: number;
  /** Rows whose note carries a personal record token, including the legacy 'Личный рекорд' spelling. */
  personalRecordCount: number;
}

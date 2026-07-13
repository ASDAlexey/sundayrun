/** One 5 km finish at an event the athlete also finished — the rival scan source (own rows included). */
export interface RivalRun {
  key: string;
  displayName: string;
  dateIso: string;
  slug: string;
  timeMs: number;
}

/** One rival: how often they finished next to the athlete and the score of those close finishes. */
export interface Rival {
  key: string;
  displayName: string;
  /** Shared 5 km finishes within the close gap. */
  closeCount: number;
  /** Close finishes where the athlete was faster. */
  wins: number;
  /** Close finishes where the rival was faster. */
  losses: number;
  /** Close finishes on the very same time. */
  draws: number;
}

/** The scan accumulator: a rival plus the gap total the tie-break reads. */
export interface RivalTally extends Rival {
  /** The sum of the time gaps over the close finishes — on a tied count the closer duel ranks higher. */
  gapSumMs: number;
}

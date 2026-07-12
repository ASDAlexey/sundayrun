/** One finished run feeding the «Легенда трассы» tally: who finished and when. */
export interface LegendFinish {
  key: string;
  displayName: string;
  dateIso: string;
}

/** One athlete's tally inside the legend window. */
export interface LegendStanding {
  key: string;
  displayName: string;
  /** Finishes inside the window — any distance; the pace never matters. */
  finishCount: number;
  /** The newest windowed finish; on a tied count the earlier one wins (they reached it first). */
  lastFinishIso: string;
}

/** The resolved title snapshot: the crown holder plus every windowed finisher, best first. */
export interface LegendBoard {
  /** The first day inside the window; empty on an archive without finishes. */
  windowStartIso: string;
  legend: LegendStanding | null;
  standings: LegendStanding[];
}

/** One athlete's view of the title: their tally and the distance left to the crown. */
export interface LegendProgress {
  isLegend: boolean;
  finishCount: number;
  /** Finishes still needed to take the crown; 0 for the holder, 1 over a vacant or tied title. */
  finishesToCrown: number;
  legend: LegendStanding | null;
}

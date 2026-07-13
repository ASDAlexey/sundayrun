/** The run fields the cross-year badge signals read; `AthleteRun` satisfies it structurally. */
export interface BadgeSignalRun {
  dateIso: string;
  timeMs: number;
  distanceKm: number;
}

/** One finished run of the whole archive keyed by athlete — the badge signals source row. */
export interface HistoryRunRow extends BadgeSignalRun {
  athleteKey: string;
}

/** One athlete's cross-year badge signals over their whole run history. */
export interface AthleteBadgeSignals {
  /** Years holding a comeback run — a finish after a break of three months and more. */
  comebackYears: ReadonlySet<string>;
  /** Year → the 5 km finishes slower than the athlete's all-time 5 km median. */
  slowFinishCountByYear: Record<string, number>;
}

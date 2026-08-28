/** One point on the course with the clock reading a runner on plan would see there. */
export interface PacePlanSplit {
  /** Metres from the start. */
  readonly meters: number;

  /** Elapsed milliseconds at that point. */
  readonly ms: number;
}

/** A target finish, the pace it asks for, and where that pace puts the clock along the way. */
export interface PacePlan {
  readonly finishMs: number;

  /** Milliseconds per kilometre. */
  readonly paceMs: number;

  readonly splits: readonly PacePlanSplit[];
}

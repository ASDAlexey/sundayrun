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

  /** Milliseconds per kilometre, averaged over the whole five — the figure the pace field holds. */
  readonly paceMs: number;

  /**
   * The pace of the closing 2,7 км over the pace of the opening 2,3 км: 1 is even, below 1 speeds
   * up. The same index `core/history/pacing.ts` reads off a finished race, so a plan and the row it
   * produced are quoted in one number.
   */
  readonly index: number;

  /** Milliseconds per kilometre on the opening 2,3 км. Equals `paceMs` when the plan is even. */
  readonly firstLegPaceMs: number;

  /** Milliseconds per kilometre on the closing 2,7 км. */
  readonly secondLegPaceMs: number;

  readonly splits: readonly PacePlanSplit[];
}

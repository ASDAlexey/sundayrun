/** A point of the course the plan puts a time on, and what the card calls it. */
export interface PacePlanPoint {
  readonly meters: number;

  readonly label: string;

  /** A lap crossing, drawn in the officials' colour the way the map draws it. */
  readonly lap: boolean;
}

/** One line of the plan as the card lists it. */
export interface PacePlanRow extends PacePlanPoint {
  /** The clock reading at that point, already formatted. */
  readonly time: string;
}

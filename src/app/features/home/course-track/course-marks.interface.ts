/** A balloon on the course map, with everything a drawing of it needs. */
export interface CourseMark {
  /** What the balloon prints: a kilometre number, or empty for the lap stopwatch. */
  readonly km: string;

  /** Non-zero on the lap boundary, which is drawn as a different kind of fact. */
  readonly lap: number;

  /** The point on the route the mark stands for, in viewBox units. */
  readonly x: number;
  readonly y: number;

  /** Where the balloon itself sits — on the point, or slid off it to clear the start disc. */
  readonly bx: number;
  readonly by: number;

  /** The spot a caption for this mark goes, and which side of it the text runs. */
  readonly lx: number;
  readonly ly: number;
  readonly anchor: string;

  /** Metres from the start that this balloon reports — one reading, or two on the lap line. */
  readonly meters: readonly number[];
}

/** A planned time drawn beside the mark it belongs to. */
export interface CourseCaption {
  readonly key: string;
  readonly x: number;
  readonly y: number;
  readonly anchor: string;
  readonly text: string;
}

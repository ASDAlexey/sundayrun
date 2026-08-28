/** One ready-made goal offered to a visitor the site knows: what to call it and what it asks for. */
export interface PlanTarget {
  /** Short caption on the button — «ЛР», «−30 с», «форма». */
  readonly label: string;

  readonly finishMs: number;
}

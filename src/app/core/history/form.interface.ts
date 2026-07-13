/** One rolling window of the «Форма» curve, anchored at the run completing it. */
export interface FormPoint {
  /** The date of the newest run in the window. */
  dateIso: string;
  /** The median time of the window's runs. */
  medianMs: number;
  /** The window against the athlete's best-ever window: 100 at the peak, lower when slower. */
  percent: number;
}

/** The «Форма» curve: every rolling window plus the peak and the latest one called out. */
export interface AthleteForm {
  /** Every window oldest first — the form chart. */
  points: FormPoint[];
  /** The earliest window with the lowest median — «лучшая форма была в мае 2025». */
  peak: FormPoint;
  /** The latest window — «вы на 94% от пика». */
  current: FormPoint;
  /**
   * The newest finish predates the freshness window — a break past FORM_STALE_DAYS. The card then
   * stops claiming a current form: no «на пике», just «лучшая форма была в …», the last dot labelled
   * «последний финиш» instead of «сейчас».
   */
  isStale: boolean;
}

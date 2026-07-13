/** One dot of the form sparkline in viewBox coordinates. */
export interface FormChartDot {
  x: number;
  y: number;
}

/** The «Форма» card prepared for the template; null (not enough finishes) hides the card. */
export interface FormView {
  /** «94» in «Сейчас — 94% от пика». */
  currentPercent: number;
  /** The latest window IS the best-ever one — the card cheers instead of quoting the percent. */
  isAtPeak: boolean;
  /** «мае 2025» — the peak month in prepositional case for «Лучшая форма была в …». */
  peakMonthText: string;
  /** The SVG polyline points of the form curve, oldest window first. */
  linePoints: string;
  /** The peak window's dot — the green marker. */
  peakDot: FormChartDot;
  /** The latest window's dot — the accent marker. */
  currentDot: FormChartDot;
}

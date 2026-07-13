/** One dot of the form sparkline in viewBox coordinates. */
export interface FormChartDot {
  x: number;
  y: number;
}

/** Where the hover tooltip anchors horizontally, so an edge dot keeps its box in view. */
export type FormTooltipAlign = 'start' | 'center' | 'end';

/** One hoverable window on the form sparkline: its dot, marker role and styled hover-tooltip data. */
export interface FormChartPoint extends FormChartDot {
  /** «6 июня 2022 г.» — the tooltip title, the window's newest run date. */
  dateText: string;
  /** «30:00» — the window's median 5 km time. */
  medianText: string;
  /** «80» in «80% от пика» — the tooltip's percent line. */
  percent: number;
  /** «6 июня 2022 г.: 30:00, 80% от пика» — the dot's accessible label (no delayed native title). */
  ariaText: string;
  /** The dot's position as a percent of the viewBox — drives the absolutely-placed tooltip. */
  leftPercent: number;
  topPercent: number;
  /** A high dot flips its tooltip below itself; a side dot anchors it by an edge. */
  tipBelow: boolean;
  tipAlign: FormTooltipAlign;
  /** The best-ever window — the green marker. */
  isPeak: boolean;
  /** The latest window — the accent marker («сейчас» / «последний финиш»). */
  isCurrent: boolean;
}

/** The «Форма» card prepared for the template; null (not enough finishes) hides the card. */
export interface FormView {
  /** «94» in «Сейчас — 94% от пика». */
  currentPercent: number;
  /** The latest window IS the best-ever one — the card cheers instead of quoting the percent. */
  isAtPeak: boolean;
  /** A season-long break — the card drops «сейчас» and only recalls «лучшая форма была в …». */
  isStale: boolean;
  /** «мае 2025» — the peak month in prepositional case for «Лучшая форма была в …». */
  peakMonthText: string;
  /** The SVG polyline points of the form curve, oldest window first. */
  linePoints: string;
  /** Every window as a hoverable dot, oldest first; the peak and latest ones carry marker flags. */
  points: FormChartPoint[];
}

/** One rendered line: the svg path, its event dots, the label placement and the hover/pick state. */
export interface BumpLineView {
  key: string;
  displayName: string;
  athleteLink: string[];
  /** `var(--chart-N)` — piped into the stroke and the label colour via a custom property. */
  colorVar: string;
  path: string;
  dots: BumpDotView[];
  finalPlace: number;
  labelY: number;
  /** The hovered line, or a picked one while nothing is hovered — drawn thicker. */
  active: boolean;
  /** Everything that is neither hovered nor picked fades away while a highlight is on. */
  dimmed: boolean;
}

/** The tooltip body split so the standings place can be tinted in the line's colour. */
export interface BumpLabelView {
  /** The full event date, e.g. «16 февраля 2025 г.». */
  date: string;
  /** The standings place on that date, e.g. «№11» — highlighted in the line's colour. */
  place: string;
  /** The season best behind that place, e.g. «27:27». */
  time: string;
}

/** One event dot on a line. */
export interface BumpDotView {
  x: number;
  y: number;
  /** The tooltip body: the full event date, the standings position and the season best behind it. */
  label: BumpLabelView;
}

/** The hover tooltip: the athlete under their line colour; a dot adds the date, position and time. */
export interface BumpTooltipView {
  x: number;
  y: number;
  /** `true` renders the tooltip under the point — the top rows have no room above. */
  below: boolean;
  name: string;
  /** Null on a between-the-dots line hover: the name alone answers «whose line is this». */
  label: BumpLabelView | null;
  colorVar: string;
}

/** One date tick under the chart. */
export interface BumpTickView {
  x: number;
  label: string;
}

/** One rank label of the left gutter with its grid line. */
export interface BumpRowView {
  y: number;
  label: string;
  /** The standings place this row marks — matched against the active lines' final place. */
  place: number;
  /** Set while an active line currently sits on this place: the label lights up in its colour. */
  active: boolean;
  /** `var(--chart-N)` of the active line on this row, or null — piped into the label fill. */
  colorVar: string | null;
}

/** Everything the template draws, precomputed from `SeasonPositions`. */
export interface BumpChartView {
  width: number;
  height: number;
  gridX1: number;
  gridX2: number;
  rankX: number;
  tickY: number;
  ticks: BumpTickView[];
  rows: BumpRowView[];
  lines: BumpLineView[];
}

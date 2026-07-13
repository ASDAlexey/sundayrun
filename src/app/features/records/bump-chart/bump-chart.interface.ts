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

/** One event dot on a line. */
export interface BumpDotView {
  x: number;
  y: number;
  /** The tooltip body: the full event date, the standings position and the season best behind it. */
  label: string;
}

/** The hover tooltip: the athlete under their line colour; a dot adds the date, position and time. */
export interface BumpTooltipView {
  x: number;
  y: number;
  /** `true` renders the tooltip under the point — the top rows have no room above. */
  below: boolean;
  name: string;
  /** Null on a between-the-dots line hover: the name alone answers «whose line is this». */
  label: string | null;
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
}

/** Everything the template draws, precomputed from `SeasonPositions`. */
export interface BumpChartView {
  width: number;
  height: number;
  gridX1: number;
  gridX2: number;
  rankX: number;
  tickY: number;
  nameX: number;
  ticks: BumpTickView[];
  rows: BumpRowView[];
  lines: BumpLineView[];
}

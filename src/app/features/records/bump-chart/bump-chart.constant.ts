/** Horizontal distance between two neighbouring event columns, px. */
export const BUMP_STEP_X = 56;

/** Height of one standings row, px; the name-label overlay relies on the same grid. */
export const BUMP_ROW_HEIGHT = 26;

/** Left gutter holding the rank numbers, px. */
export const BUMP_PAD_LEFT = 40;

/** Top padding above the first row, px. */
export const BUMP_PAD_TOP = 8;

/** Room under the chart for the date ticks, px. */
export const BUMP_PAD_BOTTOM = 30;

/** Gap between the last event column and the name labels, px. */
export const BUMP_NAME_GAP = 14;

/** Width reserved for the right-edge name labels, px. */
export const BUMP_NAME_WIDTH = 190;

/** Radius of an event dot, px. */
export const BUMP_DOT_RADIUS = 3.5;

/** Radius of the invisible per-dot hover target, px; touches the neighbouring rows, never overlaps them. */
export const BUMP_DOT_HIT_RADIUS = 13;

/** Gap between a dot and its tooltip edge, px. */
export const BUMP_TOOLTIP_OFFSET = 12;

/** Dots above this y flip the tooltip below themselves so it stays inside the scroll clip. */
export const BUMP_TOOLTIP_FLIP_Y = 60;

/** The tooltip centre never goes left of this, so the first column's tooltip is not clipped. */
export const BUMP_TOOLTIP_MIN_X = 100;

/** Distance between the plot bottom and the tick baseline, px. */
export const BUMP_TICK_OFFSET = 20;

/** Distance between the rank-number gutter and the first event column, px. */
export const BUMP_RANK_GAP = 12;

/** The line palette size — `--chart-1`…`--chart-15` in the design tokens. */
export const BUMP_PALETTE_SIZE = 15;

/** 'YYYY-MM-DD' slice bounds of the tick label parts. */
export const ISO_MONTH_START = 5;

export const ISO_MONTH_END = 7;

export const ISO_DAY_START = 8;

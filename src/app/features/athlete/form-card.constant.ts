/** The SVG viewBox of the form sparkline; CSS stretches it to the card width. */
export const FORM_CHART_WIDTH = 560;

export const FORM_CHART_HEIGHT = 120;

/** Keeps the line and the dots off the viewBox edges. */
export const FORM_CHART_PAD = 8;

/** Chart coordinates are rounded to tenths — enough for SVG, short enough for the DOM. */
export const COORD_TENTHS_BASE = 10;

/** A dot in the top part of the chart flips its hover tooltip below the point, so it never clips out the top. */
export const TOOLTIP_BELOW_MAX_TOP_PERCENT = 42;

/** Dots within this margin of a side anchor the tooltip by its edge instead of its centre, keeping it in view. */
export const TOOLTIP_EDGE_PERCENT = 22;

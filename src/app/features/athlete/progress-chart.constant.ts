/** Template reference name of the chart's `<canvas>`. */
export const CANVAS_REF = 'canvas';

/** A trend needs at least two distinct race dates. */
export const PROGRESS_MIN_POINTS = 2;

export const PROGRESS_LINE_WIDTH = 2;

export const PROGRESS_DOT_RADIUS = 3;

export const PROGRESS_BEST_DOT_RADIUS = 5;

export const PROGRESS_DOT_HOVER_EXTRA = 2;

/** A generous invisible halo around every point, so a fingertip lands on the tooltip easily. */
export const PROGRESS_DOT_HIT_RADIUS = 16;

export const PROGRESS_X_TICKS_LIMIT = 6;

export const PROGRESS_Y_TICKS_LIMIT = 5;

export const PROGRESS_TOOLTIP_PADDING = 10;

export const PROGRESS_TICK_FONT_SIZE = 11;

/** Hex-alpha suffixes for the canvas area gradient built from `--accent`. */
export const AREA_TOP_ALPHA_HEX = '3d';

export const AREA_BOTTOM_ALPHA_HEX = '00';

/** Zooming stops once the visible window shrinks to two weeks. */
export const MIN_ZOOM_RANGE_MS = 14 * 24 * 60 * 60 * 1000;

export const TICK_DATE_PART_LENGTH = 2;

export const TICK_DATE_PAD_CHAR = '0';

/** '2026' → '26' on the compact x axis. */
export const TICK_YEAR_TAIL = -2;

export const FIRST_MONTH_OFFSET = 1;

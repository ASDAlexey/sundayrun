/** Resolved CSS custom property values: chart.js paints on canvas and cannot read `var(...)` itself. */
export interface ProgressChartPalette {
  accent: string;
  green: string;
  surface: string;
  border: string;
  borderSoft: string;
  text: string;
  textMuted: string;
  fontMono: string;
}

/** Fires on every zoom/pan gesture; `zoomed` drives the reset-zoom button visibility. */
export type ProgressViewportChange = (zoomed: boolean) => void;

/** One plotted race day (the fastest run of that date). */
export interface ProgressDay {
  dateIso: string;
  timeMs: number;
}

// The interfaces below are deliberately narrow structural views of chart.js types:
// callbacks declared against them stay assignable to chart.js options (parameter
// contravariance) while specs can drive them without constructing a real Chart.

export interface ProgressTooltipEntry {
  dataIndex: number;
}

export interface ProgressTooltipCallbacks {
  title(items: readonly ProgressTooltipEntry[]): string;
  label(item: ProgressTooltipEntry): string;
  afterLabel(item: ProgressTooltipEntry): string;
}

export interface ProgressViewportContext {
  chart: { isZoomedOrPanned(): boolean };
}

export interface ProgressChartArea {
  top: number;
  bottom: number;
}

export interface ProgressAreaContext {
  chart: {
    ctx: { createLinearGradient(x0: number, y0: number, x1: number, y1: number): CanvasGradient };
    chartArea?: ProgressChartArea;
  };
}

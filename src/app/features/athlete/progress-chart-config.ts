import type { ChartConfiguration, ChartDataset, ChartOptions } from 'chart.js';
// Type-only: pulls in the module augmentation for `plugins.zoom` and `isZoomedOrPanned`, erased at runtime.
import type {} from 'chartjs-plugin-zoom';
import type { ZoomPluginOptions } from 'chartjs-plugin-zoom/types/options';

import { AthleteRun } from '../../core/models/athlete-history.interface';
import { formatDuration } from '../../core/time/duration';
import { formatRussianDateLong } from '../../core/time/russian-date';
import {
  AREA_BOTTOM_ALPHA_HEX,
  AREA_TOP_ALPHA_HEX,
  FIRST_MONTH_OFFSET,
  MIN_ZOOM_RANGE_MS,
  PROGRESS_BEST_DOT_RADIUS,
  PROGRESS_DOT_HIT_RADIUS,
  PROGRESS_DOT_HOVER_EXTRA,
  PROGRESS_DOT_RADIUS,
  PROGRESS_LINE_WIDTH,
  PROGRESS_MIN_POINTS,
  PROGRESS_TICK_FONT_SIZE,
  PROGRESS_TOOLTIP_PADDING,
  PROGRESS_X_TICKS_LIMIT,
  PROGRESS_Y_TICKS_LIMIT,
  TICK_DATE_PAD_CHAR,
  TICK_DATE_PART_LENGTH,
  TICK_YEAR_TAIL,
} from './progress-chart.constant';
import {
  ProgressAreaContext,
  ProgressChartPalette,
  ProgressDay,
  ProgressTooltipCallbacks,
  ProgressViewportChange,
  ProgressViewportContext,
} from './progress-chart.interface';

/** The chart makes sense only once there are two distinct race dates to connect. */
export function hasProgressTrend(runs: AthleteRun[]): boolean {
  return bestPerDate(runs).length >= PROGRESS_MIN_POINTS;
}

/**
 * Full chart.js configuration for the best-time-per-date line: same-day runs collapse
 * to the fastest one, x is a real time scale (gaps between races stay visible), y is
 * the finish time, so an improving athlete draws a line descending to the green
 * personal-best dots. Zoom/pan is x-only and reports back through `onViewportChange`.
 */
export function buildProgressChartConfig(
  runs: AthleteRun[],
  palette: ProgressChartPalette,
  onViewportChange: ProgressViewportChange,
): ChartConfiguration<'line'> | null {
  const days = bestPerDate(runs);

  if (days.length < PROGRESS_MIN_POINTS) {
    return null;
  }

  const bestMs = Math.min(...days.map((day) => day.timeMs));
  const isBest = days.map((day) => day.timeMs === bestMs);

  return {
    type: 'line',
    data: { datasets: [buildDataset(days, isBest, palette)] },
    options: buildOptions(days, isBest, palette, onViewportChange),
  };
}

/** Per-point arrays instead of scriptables: cheaper for chart.js and directly assertable in specs. */
function buildDataset(days: ProgressDay[], isBest: boolean[], palette: ProgressChartPalette): ChartDataset<'line'> {
  return {
    data: days.map((day) => ({ x: Date.parse(day.dateIso), y: day.timeMs })),
    borderColor: palette.accent,
    borderWidth: PROGRESS_LINE_WIDTH,
    fill: 'start',
    backgroundColor: areaGradient(palette),
    pointBackgroundColor: isBest.map((best) => (best ? palette.green : palette.surface)),
    pointBorderColor: isBest.map((best) => (best ? palette.green : palette.accent)),
    pointRadius: isBest.map(toPointRadius),
    pointHoverRadius: isBest.map((best) => toPointRadius(best) + PROGRESS_DOT_HOVER_EXTRA),
    pointHitRadius: PROGRESS_DOT_HIT_RADIUS,
  };
}

function buildOptions(
  days: ProgressDay[],
  isBest: boolean[],
  palette: ProgressChartPalette,
  onViewportChange: ProgressViewportChange,
): ChartOptions<'line'> {
  const tickFont = { family: palette.fontMono, size: PROGRESS_TICK_FONT_SIZE };

  return {
    responsive: true,
    maintainAspectRatio: false,
    // Axis-locked nearest-point matching: a fingertip anywhere near the line lands on a run.
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
    scales: {
      x: {
        type: 'linear',
        bounds: 'data',
        grid: { display: false },
        border: { color: palette.border },
        ticks: {
          color: palette.textMuted,
          font: tickFont,
          callback: formatEpochTick,
          maxTicksLimit: PROGRESS_X_TICKS_LIMIT,
          maxRotation: 0,
        },
      },
      y: {
        grace: '10%',
        grid: { color: palette.borderSoft },
        border: { display: false },
        ticks: { color: palette.textMuted, font: tickFont, callback: formatTimeTick, maxTicksLimit: PROGRESS_Y_TICKS_LIMIT },
      },
    },
    plugins: {
      tooltip: {
        displayColors: false,
        backgroundColor: palette.surface,
        borderColor: palette.border,
        borderWidth: 1,
        padding: PROGRESS_TOOLTIP_PADDING,
        titleColor: palette.text,
        bodyColor: palette.text,
        titleFont: tickFont,
        bodyFont: tickFont,
        callbacks: tooltipCallbacks(days, isBest),
      },
      zoom: zoomOptions(viewportNotifier(onViewportChange)),
    },
  };
}

/** Collapses same-day runs to the fastest one, chronologically ascending. */
function bestPerDate(runs: AthleteRun[]): ProgressDay[] {
  const byDate = new Map<string, number>();

  for (const run of runs) {
    const known = byDate.get(run.dateIso);

    byDate.set(run.dateIso, known === undefined ? run.timeMs : Math.min(known, run.timeMs));
  }

  return [...byDate.entries()]
    .map(([dateIso, timeMs]) => ({ dateIso, timeMs }))
    .sort((left, right) => left.dateIso.localeCompare(right.dateIso));
}

/** Full russian date as the title, the run time as the body, a personal-record badge line when it applies. */
export function tooltipCallbacks(days: ProgressDay[], isBest: boolean[]): ProgressTooltipCallbacks {
  return {
    title: (items) => formatRussianDateLong(days[items[0].dataIndex].dateIso),
    label: (item) => $localize`:@@athlete.chartTooltipTime:Время: ${formatDuration(days[item.dataIndex].timeMs)}:time:`,
    afterLabel: (item) => (isBest[item.dataIndex] ? $localize`:@@athlete.chartTooltipBest:Личный рекорд` : ''),
  };
}

/** Translates the plugin's gesture events into a plain "is the viewport off the full history" flag. */
export function viewportNotifier(onViewportChange: ProgressViewportChange): (context: ProgressViewportContext) => void {
  return ({ chart }) => onViewportChange(chart.isZoomedOrPanned());
}

/** A vertical accent fade under the line; falls back to the transparent stop until the chart area exists. */
export function areaGradient(palette: ProgressChartPalette): (context: ProgressAreaContext) => CanvasGradient | string {
  const topColor = `${palette.accent}${AREA_TOP_ALPHA_HEX}`;
  const bottomColor = `${palette.accent}${AREA_BOTTOM_ALPHA_HEX}`;

  return ({ chart }) => {
    if (!chart.chartArea) {
      return bottomColor;
    }

    const gradient = chart.ctx.createLinearGradient(0, chart.chartArea.top, 0, chart.chartArea.bottom);

    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);

    return gradient;
  };
}

/** Epoch milliseconds → compact '13.03.22'; UTC getters match `Date.parse` of a date-only ISO string. */
export function formatEpochTick(value: number | string): string {
  const date = new Date(Number(value));
  const day = String(date.getUTCDate()).padStart(TICK_DATE_PART_LENGTH, TICK_DATE_PAD_CHAR);
  const month = String(date.getUTCMonth() + FIRST_MONTH_OFFSET).padStart(TICK_DATE_PART_LENGTH, TICK_DATE_PAD_CHAR);

  return `${day}.${month}.${String(date.getUTCFullYear()).slice(TICK_YEAR_TAIL)}`;
}

export function formatTimeTick(value: number | string): string {
  return formatDuration(Number(value));
}

/** X-only zoom (wheel and pinch) and pan, never past the full history, never closer than two weeks. */
function zoomOptions(notifyViewport: (context: ProgressViewportContext) => void): ZoomPluginOptions {
  return {
    limits: { x: { min: 'original', max: 'original', minRange: MIN_ZOOM_RANGE_MS } },
    pan: { enabled: true, mode: 'x', onPanComplete: notifyViewport },
    zoom: {
      wheel: { enabled: true },
      pinch: { enabled: true },
      mode: 'x',
      onZoomComplete: notifyViewport,
    },
  };
}

function toPointRadius(isBest: boolean): number {
  return isBest ? PROGRESS_BEST_DOT_RADIUS : PROGRESS_DOT_RADIUS;
}

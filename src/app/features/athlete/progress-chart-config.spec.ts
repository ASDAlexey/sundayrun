import type { ChartConfiguration } from 'chart.js';

import {
  areaGradient,
  buildProgressChartConfig,
  formatEpochTick,
  formatTimeTick,
  hasProgressTrend,
  personalBestMs,
  tooltipCallbacks,
  viewportNotifier,
} from './progress-chart-config';
import { MIN_ZOOM_RANGE_MS } from './progress-chart.constant';
import {
  BEST_POINT_INDEX,
  EXPECTED_AREA_BOTTOM_COLOR,
  EXPECTED_AREA_TOP_COLOR,
  EXPECTED_IS_BEST,
  EXPECTED_POINT_BACKGROUNDS,
  EXPECTED_POINT_BACKGROUNDS_NO_BEST,
  EXPECTED_POINT_BORDERS,
  EXPECTED_POINT_HOVER_RADII,
  EXPECTED_POINT_RADII,
  EXPECTED_PROGRESS_DAYS,
  EXPECTED_PROGRESS_POINTS,
  EXPECTED_TOOLTIP_BEST,
  EXPECTED_TOOLTIP_TIME,
  EXPECTED_TOOLTIP_TITLE,
  EXPECTED_X_TICK_TEXT,
  EXPECTED_Y_TICK_TEXT,
  MOCK_PALETTE,
  OFF_CHART_BEST_MS,
  PROGRESS_BEST_MS,
  PROGRESS_RUNS,
  REGULAR_POINT_INDEX,
  SAME_DAY_ONLY_RUNS,
} from './progress-chart.mock';

describe('progress-chart-config', () => {
  function buildConfig(bestMs = PROGRESS_BEST_MS): ChartConfiguration<'line'> | null {
    return buildProgressChartConfig(PROGRESS_RUNS, bestMs, MOCK_PALETTE, vi.fn());
  }

  it('needs two distinct race dates: same-day duplicates collapse and kill the trend', () => {
    expect(hasProgressTrend(PROGRESS_RUNS)).toBe(true);
    expect(hasProgressTrend(SAME_DAY_ONLY_RUNS)).toBe(false);
    expect(hasProgressTrend([])).toBe(false);
    expect(buildProgressChartConfig(SAME_DAY_ONLY_RUNS, PROGRESS_BEST_MS, MOCK_PALETTE, vi.fn())).toBeNull();
  });

  it('plots the fastest run per date chronologically and styles personal-best points distinctly', () => {
    const dataset = buildConfig()?.data.datasets[0];

    expect(personalBestMs(PROGRESS_RUNS)).toBe(PROGRESS_BEST_MS);
    expect(dataset?.data).toEqual(EXPECTED_PROGRESS_POINTS);
    expect(dataset?.borderColor).toBe(MOCK_PALETTE.accent);
    expect(dataset?.fill).toBe('start');
    expect(dataset?.pointBackgroundColor).toEqual(EXPECTED_POINT_BACKGROUNDS);
    expect(dataset?.pointBorderColor).toEqual(EXPECTED_POINT_BORDERS);
    expect(dataset?.pointRadius).toEqual(EXPECTED_POINT_RADII);
    expect(dataset?.pointHoverRadius).toEqual(EXPECTED_POINT_HOVER_RADII);
    expect(
      buildConfig(OFF_CHART_BEST_MS)?.data.datasets[0].pointBackgroundColor,
      'no green dot when the record day is filtered out of the view',
    ).toEqual(EXPECTED_POINT_BACKGROUNDS_NO_BEST);
  });

  it('formats tooltips and axis ticks as russian dates and durations', () => {
    const callbacks = tooltipCallbacks(EXPECTED_PROGRESS_DAYS, EXPECTED_IS_BEST);

    expect(callbacks.title([{ dataIndex: REGULAR_POINT_INDEX }])).toBe(EXPECTED_TOOLTIP_TITLE);
    expect(callbacks.label({ dataIndex: BEST_POINT_INDEX })).toBe(EXPECTED_TOOLTIP_TIME);
    expect(callbacks.afterLabel({ dataIndex: BEST_POINT_INDEX })).toBe(EXPECTED_TOOLTIP_BEST);
    expect(callbacks.afterLabel({ dataIndex: REGULAR_POINT_INDEX })).toBe('');

    expect(formatEpochTick(EXPECTED_PROGRESS_POINTS[BEST_POINT_INDEX].x)).toBe(EXPECTED_X_TICK_TEXT);
    expect(formatTimeTick(EXPECTED_PROGRESS_POINTS[BEST_POINT_INDEX].y)).toBe(EXPECTED_Y_TICK_TEXT);

    const options = buildConfig()?.options;

    expect(options?.scales?.['x']?.ticks?.callback).toBe(formatEpochTick);
    expect(options?.scales?.['y']?.ticks?.callback).toBe(formatTimeTick);
    expect(typeof options?.plugins?.tooltip?.callbacks?.title).toBe('function');
  });

  it('reports zoom/pan state through the viewport callback and locks zoom to the x axis', () => {
    const onViewportChange = vi.fn();
    const notifier = viewportNotifier(onViewportChange);

    notifier({ chart: { isZoomedOrPanned: () => true } });
    notifier({ chart: { isZoomedOrPanned: () => false } });

    expect(onViewportChange).toHaveBeenNthCalledWith(1, true);
    expect(onViewportChange).toHaveBeenNthCalledWith(2, false);

    const zoom = buildConfig()?.options?.plugins?.zoom;

    expect(zoom?.limits).toEqual({ x: { min: 'original', max: 'original', minRange: MIN_ZOOM_RANGE_MS } });
    expect(zoom?.zoom?.mode).toBe('x');
    expect(zoom?.pan?.mode).toBe('x');
    expect(typeof zoom?.zoom?.onZoomComplete).toBe('function');
    expect(typeof zoom?.pan?.onPanComplete).toBe('function');
  });

  it('fades the accent area gradient once the chart area exists, falling back to transparent before layout', () => {
    const gradientStops: [number, string][] = [];
    const gradient = { addColorStop: (offset: number, color: string) => gradientStops.push([offset, color]) };
    const createLinearGradient = (): CanvasGradient => gradient;
    const backgroundColor = areaGradient(MOCK_PALETTE);

    expect(backgroundColor({ chart: { ctx: { createLinearGradient } } }), 'no layout yet').toBe(EXPECTED_AREA_BOTTOM_COLOR);
    expect(backgroundColor({ chart: { ctx: { createLinearGradient }, chartArea: { top: 0, bottom: 100 } } })).toBe(gradient);
    expect(gradientStops).toEqual([
      [0, EXPECTED_AREA_TOP_COLOR],
      [1, EXPECTED_AREA_BOTTOM_COLOR],
    ]);
  });
});

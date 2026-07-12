import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import type { Chart } from 'chart.js';

import { filterRuns } from '../../core/history/athlete-runs';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { buildProgressChartConfig, hasProgressTrend, personalBestMs } from './progress-chart-config';
import { CANVAS_REF } from './progress-chart.constant';
import { ProgressChartPalette } from './progress-chart.interface';

type ChartClass = typeof Chart;

/** chart.js is heavy and canvas-only, so it stays out of the initial bundle until a chart is actually drawn. */
let chartClassPromise: Promise<ChartClass> | null = null;

function loadChartClass(): Promise<ChartClass> {
  chartClassPromise ??= Promise.all([import('chart.js'), import('chartjs-plugin-zoom')]).then(
    ([{ Chart: ChartJs, Filler, LinearScale, LineController, LineElement, PointElement, Tooltip }, { default: zoomPlugin }]) => {
      ChartJs.register(LineController, LineElement, PointElement, LinearScale, Tooltip, Filler, zoomPlugin);

      return ChartJs;
    },
  );

  return chartClassPromise;
}

/**
 * Interactive best-time-per-date chart of an athlete's 5 km runs: tap-friendly tooltips,
 * pinch/wheel zoom and pan along the date axis, personal bests highlighted in green.
 * A `year` narrows the chart to the in-year progress; the green dots always mark the
 * all-time record, so they vanish rather than drift when the record year is filtered out.
 * The whole card disappears until the visible period has two distinct race dates.
 */
@Component({
  selector: 'app-progress-chart',
  templateUrl: './progress-chart.html',
  styleUrl: './progress-chart.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressChart {
  readonly #visibleRuns = computed(() => filterRuns(this.runs(), this.year(), null));

  readonly runs = input.required<AthleteRun[]>();
  /** `null` plots the whole history across years. */
  readonly year = input<string | null>(null);
  readonly hasChart = computed(() => hasProgressTrend(this.#visibleRuns()));
  readonly zoomed = signal(false);

  // Signal queries cannot live on ES-private (`#`) fields.
  readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>(CANVAS_REF);

  #chart: Chart | null = null;
  #renderToken = 0;

  constructor() {
    // The canvas lives under `@if (hasChart())`, so all the signals drive one render effect.
    effect(() => {
      void this.#render(this.#visibleRuns(), personalBestMs(this.runs()), this.canvasRef()?.nativeElement ?? null);
    });
    inject(DestroyRef).onDestroy(() => this.#destroyChart());
  }

  resetZoom(): void {
    this.#chart?.resetZoom();
    this.zoomed.set(false);
  }

  /** A named property (not an inline closure) so the zoom-state wiring is reachable from specs. */
  protected readonly onViewportChange = (zoomed: boolean): void => {
    this.zoomed.set(zoomed);
  };

  async #render(runs: AthleteRun[], bestMs: number, canvas: HTMLCanvasElement | null): Promise<void> {
    const token = ++this.#renderToken;

    this.#destroyChart();
    this.zoomed.set(false);

    if (canvas === null) {
      return;
    }

    // The canvas can outlive the trend for one change-detection turn, so the builder's null gate is the real guard.
    const config = buildProgressChartConfig(runs, bestMs, readPalette(canvas), this.onViewportChange);

    if (config === null) {
      return;
    }

    const chartClass = await loadChartClass();

    // A newer render (navigation to another athlete) may have started while chart.js was loading.
    if (token === this.#renderToken) {
      this.#chart = new chartClass(canvas, config);
    }
  }

  #destroyChart(): void {
    this.#chart?.destroy();
    this.#chart = null;
  }
}

/** Resolves the Litely CSS variables at the canvas, so the chart follows the active theme. */
function readPalette(canvas: HTMLCanvasElement): ProgressChartPalette {
  const style = getComputedStyle(canvas);
  const read = (name: string): string => style.getPropertyValue(name).trim();

  return {
    accent: read('--accent'),
    green: read('--green'),
    surface: read('--surface'),
    border: read('--border'),
    borderSoft: read('--border-soft'),
    text: read('--text'),
    textMuted: read('--text-muted'),
    fontMono: read('--mono'),
  };
}

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chart } from 'chart.js';

import { AthleteRun } from '../../core/models/athlete-history.interface';
import { settle } from '../spec-utils/settle';
import { ProgressChart } from './progress-chart';
import {
  CHART_SINGLE_DATE_YEAR,
  CHART_TREND_YEAR,
  EXPECTED_TREND_YEAR_POINTS,
  PROGRESS_RUNS,
  PROGRESS_RUNS_ALT,
  SAME_DAY_ONLY_RUNS,
} from './progress-chart.mock';

// One shared chart.js mock across every chart-rendering spec — see `chart-js.mock.ts` for why the
// component's bundle-wide `chartClassPromise` singleton forces all specs onto the same Chart object.
vi.mock('chart.js', async () => (await import('./chart-js.mock')).chartJsMock);

vi.mock('chartjs-plugin-zoom', () => ({ default: {} }));

describe('ProgressChart', () => {
  const chartConstructorMock = vi.mocked(Chart);

  let fixture: ComponentFixture<ProgressChart>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    fixture.destroy();
  });

  async function createChart(runs: AthleteRun[]): Promise<ProgressChart> {
    fixture = TestBed.createComponent(ProgressChart);
    fixture.componentRef.setInput('runs', runs);
    fixture.detectChanges();
    await settle();

    return fixture.componentInstance;
  }

  it('draws the chart on the canvas once loaded and tears it down when the trend disappears', async () => {
    const chart = await createChart(PROGRESS_RUNS);

    expect(chart.hasChart()).toBe(true);
    expect(chartConstructorMock).toHaveBeenCalledTimes(1);

    const [canvas, config] = chartConstructorMock.mock.calls[0];
    const chartInstance = chartConstructorMock.mock.results[0].value;

    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
    expect(config).toEqual(expect.objectContaining({ type: 'line' }));

    fixture.componentRef.setInput('runs', SAME_DAY_ONLY_RUNS);
    fixture.detectChanges();
    await settle();

    expect(chart.hasChart()).toBe(false);
    expect(chartInstance.destroy).toHaveBeenCalledTimes(1);
    expect(chartConstructorMock, 'no second chart without a trend').toHaveBeenCalledTimes(1);
  });

  it('mirrors zoom gestures into the reset button state and resets the viewport on demand', async () => {
    const chart = await createChart(PROGRESS_RUNS);
    const chartInstance = chartConstructorMock.mock.results[0].value;
    const onViewportChange: unknown = Reflect.get(chart, 'onViewportChange');

    expect(chart.zoomed()).toBe(false);

    if (typeof onViewportChange === 'function') {
      onViewportChange(true);
    }

    expect(chart.zoomed()).toBe(true);

    chart.resetZoom();

    expect(chartInstance.resetZoom).toHaveBeenCalledTimes(1);
    expect(chart.zoomed()).toBe(false);
  });

  it('lets the newest render win when runs change while chart.js is still loading', async () => {
    fixture = TestBed.createComponent(ProgressChart);
    fixture.componentRef.setInput('runs', PROGRESS_RUNS);
    fixture.detectChanges();

    // No settle in between: the first render is still awaiting the chart.js import.
    fixture.componentRef.setInput('runs', PROGRESS_RUNS_ALT);
    fixture.detectChanges();
    await settle();

    expect(chartConstructorMock, 'the stale render never constructs a chart').toHaveBeenCalledTimes(1);

    const [, config] = chartConstructorMock.mock.calls[0];

    expect(config.data.datasets[0].data).toHaveLength(PROGRESS_RUNS_ALT.length);
  });

  it('renders no card at all for a single race date', async () => {
    const chart = await createChart(SAME_DAY_ONLY_RUNS);

    expect(chart.hasChart()).toBe(false);
    expect(chartConstructorMock).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('canvas')).toBeNull();
  });

  it('narrows the chart to the selected year and hides the card when the year has one race date', async () => {
    const chart = await createChart(PROGRESS_RUNS);

    fixture.componentRef.setInput('year', CHART_TREND_YEAR);
    fixture.detectChanges();
    await settle();

    expect(chart.hasChart()).toBe(true);

    const [, config] = chartConstructorMock.mock.calls.at(-1) ?? [];

    expect(config?.data.datasets[0].data, 'only the in-year points are plotted').toEqual(EXPECTED_TREND_YEAR_POINTS);
    expect(fixture.nativeElement.querySelector('.progress__year')?.textContent.trim()).toBe(CHART_TREND_YEAR);

    fixture.componentRef.setInput('year', CHART_SINGLE_DATE_YEAR);
    fixture.detectChanges();
    await settle();

    expect(chart.hasChart(), 'a single in-year race date is not a trend').toBe(false);
    expect(fixture.nativeElement.querySelector('canvas')).toBeNull();
  });
});

import { CHART_HEIGHT, CHART_PACE_SPREAD, CHART_PAD } from './my-track.constant';
import { TRACK_RUN_MOCK } from './my-track.mock';
import { buildPaceChart } from './pace-chart';
import { buildFrames } from './track-shape';

describe('buildPaceChart', () => {
  it('plots the run against its own average and marks the kilometres', () => {
    const frames = buildFrames(TRACK_RUN_MOCK);
    const chart = buildPaceChart(TRACK_RUN_MOCK, frames);

    expect(chart.averageY, 'the average runs through the middle of the box').toBe(CHART_HEIGHT / 2);
    expect(chart.ticks.map((tick) => tick.label)).toEqual(['1', '2', '3', '4', '5']);
    expect(chart.linePoints.split(' ')).toHaveLength(frames.length);
    expect(chart.averagePaceText).toBe('3:45');
    expect(chart.fastestPaceText, `the scale reaches ${CHART_PACE_SPREAD * 100}% either side`).toBe('2:49');
    expect(chart.slowestPaceText).toBe('4:41');
  });

  it('clamps a stride the receiver lost to the edge of the scale instead of flattening the run', () => {
    const lost = { ...TRACK_RUN_MOCK, samples: TRACK_RUN_MOCK.samples.map((sample) => ({ ...sample, paceMs: sample.paceMs * 3 })) };
    const chart = buildPaceChart(lost, buildFrames(lost));
    const ys = chart.linePoints.split(' ').map((point) => Number(point.split(',')[1]));

    expect(Math.max(...ys)).toBe(CHART_HEIGHT - CHART_PAD);
  });
});

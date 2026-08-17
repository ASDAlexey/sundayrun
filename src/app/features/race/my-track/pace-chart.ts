import { formatDuration } from '../../../core/time/duration';
import { METERS_IN_KM } from '../../../core/track/track-distance.constant';
import { TrackRun } from '../../../core/track/track-run.interface';
import { CHART_HEIGHT, CHART_PACE_SPREAD, CHART_PAD, CHART_WIDTH, COORD_TENTHS_BASE } from './my-track.constant';
import { PaceChartView, TrackFrame } from './my-track.interface';

/**
 * The run read along its distance: pace on the vertical, kilometres on the horizontal, the average
 * as a line straight through the middle.
 *
 * The map answers «where did I slow down» and this answers «by how much» — the two are the same
 * numbers, and neither says it on its own.
 */
export function buildPaceChart(run: TrackRun, frames: TrackFrame[]): PaceChartView {
  const spread = run.paceMs * CHART_PACE_SPREAD;
  const toY = (paceMs: number): number => {
    // Clamped: a stride lost under the trees comes back from the receiver at half pace, and a chart
    // scaled to that is a flat line with one spike where the race used to be.
    const offset = Math.min(Math.max(paceMs - run.paceMs, -spread), spread);

    return round(CHART_PAD + ((offset + spread) / (spread * 2)) * (CHART_HEIGHT - CHART_PAD * 2));
  };
  const toX = (metersIn: number): number => round(CHART_PAD + (metersIn / run.distanceM) * (CHART_WIDTH - CHART_PAD * 2));

  return {
    linePoints: frames.map((frame) => `${toX(frame.metersIn)},${toY(frame.paceMs)}`).join(' '),
    averageY: toY(run.paceMs),
    ticks: run.splits.map((split) => ({ x: toX(split.km * METERS_IN_KM), label: String(split.km) })),
    fastestPaceText: formatDuration(run.paceMs - spread),
    slowestPaceText: formatDuration(run.paceMs + spread),
    averagePaceText: formatDuration(run.paceMs),
  };
}

function round(value: number): number {
  return Math.round(value * COORD_TENTHS_BASE) / COORD_TENTHS_BASE;
}

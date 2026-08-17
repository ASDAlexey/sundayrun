import { DECIMAL_COMMA, DECIMAL_POINT } from '../../../core/history/score-text.constant';
import { formatDuration, formatRaceTime } from '../../../core/time/duration';
import { MS_IN_SECOND } from '../../../core/time/duration.constant';
import { METERS_IN_KM } from '../../../core/track/track-distance.constant';
import { TrackRun } from '../../../core/track/track-run.interface';
import {
  COURSE_ALLEY_PATH,
  COURSE_FINISH_POINT,
  COURSE_START_POINT,
  COURSE_VIEW_BOX,
} from '../../home/course-track/course-geometry.constant';
import { KM_FRACTION_DIGITS } from './my-track.constant';
import { MyTrackView } from './my-track.interface';
import { buildPaceChart } from './pace-chart';
import { buildFrames, buildTraces } from './track-shape';

/**
 * One recording, ready for the card: the shape to draw, the curve to plot, and the four or five
 * sentences worth saying about it.
 *
 * Every time here is printed to the whole second by `formatDuration` rather than to hundredths.
 * Hundredths belong to results a stopwatch measured on the line; a figure a wrist receiver arrived
 * at by adding up satellites has no business claiming that precision, and the protocol's own time
 * is printed beside it in the form the protocol uses.
 */
export function buildMyTrackView(run: TrackRun): MyTrackView {
  const frames = buildFrames(run);

  return {
    viewBox: COURSE_VIEW_BOX,
    alleyPath: COURSE_ALLEY_PATH,
    startPoint: COURSE_START_POINT,
    finishPoint: COURSE_FINISH_POINT,
    frames,
    traces: buildTraces(frames),
    chart: buildPaceChart(run, frames),
    totalSeconds: run.samples[run.samples.length - 1].secondsIn,
    distanceMeters: Math.round(run.distanceM),
    distanceText: (run.distanceM / METERS_IN_KM).toFixed(KM_FRACTION_DIGITS).replace(DECIMAL_POINT, DECIMAL_COMMA),
    durationText: formatDuration(run.durationMs),
    paceText: formatDuration(run.paceMs),
    fastestKm: run.fastestSplit.km,
    fastestKmText: formatDuration(run.fastestSplit.durationMs),
    extraMeters: Math.abs(Math.round(run.extraM)),
    extraSeconds: Math.round(Math.abs(run.extraMs) / MS_IN_SECOND),
    isLonger: run.extraM > 0,
    watchGapSeconds: run.watchGapMs === null ? null : Math.abs(Math.round(run.watchGapMs / MS_IN_SECOND)),
    officialText: run.watchGapMs === null ? null : formatRaceTime(run.durationMs - run.watchGapMs),
  };
}

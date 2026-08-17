import { MS_IN_SECOND } from '../time/duration.constant';
import { metersBetween } from './track-distance';
import { METERS_IN_KM } from './track-distance.constant';
import { TrackPoint, TrackSample } from './track-point.interface';
import { DECLARED_RACE_METERS, PACE_WINDOW_M, TRACK_MIN_METERS, TRACK_MIN_SAMPLES } from './track-run.constant';
import { TrackRun, TrackSplit } from './track-run.interface';

/** A sample placed along the line, before it is told what pace it was run at. */
type PlacedPoint = TrackPoint & { metersIn: number };

/**
 * One recording turned into a run: how far the watch made it, how fast, and where the kilometres
 * fell.
 *
 * Nothing is rescaled to the protocol. The temptation is to stretch the recording onto the official
 * time so the two agree, and it would be a lie in the direction of tidiness — the watch started
 * before the gun and stopped after the line, and saying so («по часам 23:20, в протоколе 23:04»)
 * is more useful than hiding it.
 *
 * Returns null for anything too short to be this race: a watch stopped at the start, a file that
 * lost its samples, a warm-up that happened to be in the folder.
 */
export function buildTrackRun(points: TrackPoint[], officialMs: number | null): TrackRun | null {
  const placed = withDistances(points);

  if (placed.length < TRACK_MIN_SAMPLES) {
    return null;
  }

  const last = placed[placed.length - 1];

  if (last.metersIn < TRACK_MIN_METERS) {
    return null;
  }

  const distanceM = last.metersIn;
  const durationMs = (last.secondsIn - placed[0].secondsIn) * MS_IN_SECOND;
  const paceMs = (durationMs * METERS_IN_KM) / distanceM;
  const samples: TrackSample[] = placed.map((point, index) => ({ ...point, paceMs: paceAt(placed, index) }));
  const splits = wholeKmSplits(placed);
  const extraM = distanceM - DECLARED_RACE_METERS;

  return {
    samples,
    distanceM,
    durationMs,
    paceMs,
    splits,
    // `TRACK_MIN_METERS` is a whole kilometre, so there is always at least one split to pick from.
    fastestSplit: splits.reduce((best, split) => (split.durationMs < best.durationMs ? split : best)),
    extraM,
    extraMs: (extraM / METERS_IN_KM) * paceMs,
    watchGapMs: officialMs === null ? null : durationMs - officialMs,
  };
}

/** Walks the line, adding up how far each sample sits along it. */
function withDistances(points: TrackPoint[]): PlacedPoint[] {
  let metersIn = 0;

  return points.map((point, index) => {
    metersIn += index === 0 ? 0 : metersBetween(points[index - 1], point);

    return { ...point, metersIn };
  });
}

/**
 * Pace over a window centred on one sample, in milliseconds per kilometre.
 *
 * The window is grown until the sample at each end is itself outside it, so the span it covers is
 * at least `PACE_WINDOW_M` in every direction that has any run left in it — and, since the whole
 * recording is at least a kilometre long, never zero. That is what makes the division safe without
 * a guard nobody could ever trigger.
 */
function paceAt(samples: PlacedPoint[], index: number): number {
  const centre = samples[index].metersIn;
  let from = index;
  let to = index;

  while (from > 0 && centre - samples[from].metersIn < PACE_WINDOW_M) {
    from -= 1;
  }

  while (to < samples.length - 1 && samples[to].metersIn - centre < PACE_WINDOW_M) {
    to += 1;
  }

  const meters = samples[to].metersIn - samples[from].metersIn;
  const seconds = samples[to].secondsIn - samples[from].secondsIn;

  return (seconds * MS_IN_SECOND * METERS_IN_KM) / meters;
}

/** Each whole kilometre of the recording, timed between the points where the line crosses it. */
function wholeKmSplits(samples: PlacedPoint[]): TrackSplit[] {
  const kilometres = Math.floor(samples[samples.length - 1].metersIn / METERS_IN_KM);
  const splits: TrackSplit[] = [];
  let previousSeconds = samples[0].secondsIn;

  for (let km = 1; km <= kilometres; km += 1) {
    const seconds = secondsAt(samples, km * METERS_IN_KM);

    splits.push({ km, durationMs: (seconds - previousSeconds) * MS_IN_SECOND });
    previousSeconds = seconds;
  }

  return splits;
}

/** When the run passed a given distance, interpolated between the two samples either side of it. */
function secondsAt(samples: PlacedPoint[], meters: number): number {
  const index = samples.findIndex((sample) => sample.metersIn >= meters);
  const after = samples[index];
  const before = samples[index - 1];
  // Safe to divide by: `after` is the first sample at or past the mark, so `before` is strictly
  // short of it and the two cannot sit on the same metre.
  const span = after.metersIn - before.metersIn;

  return before.secondsIn + ((meters - before.metersIn) / span) * (after.secondsIn - before.secondsIn);
}

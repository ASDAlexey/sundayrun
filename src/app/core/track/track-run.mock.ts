import { DEGREES_IN_HALF_TURN, EARTH_RADIUS_M } from './track-distance.constant';
import { TrackPoint } from './track-point.interface';

/** The start line of the course, so the synthetic run reads as this race rather than as maths. */
const START_LAT = 47.2205832;

const START_LON = 38.9222712;

/** Due north, one sample a second: a straight meridian makes every distance below exact. */
const METERS_PER_DEGREE = (EARTH_RADIUS_M * Math.PI) / DEGREES_IN_HALF_TURN;

/** A negative split with nothing subtle about it: 3:20 per km, then 4:10. */
export const FAST_HALF_SPEED_MS = 5;

export const SLOW_HALF_SPEED_MS = 4;

export const HALF_DISTANCE_M = 2520;

/** 5040 m in 18:54 — a watch's account of a five-kilometre race, drifting long as they do. */
export const TRACK_POINTS_MOCK: TrackPoint[] = buildRun(FAST_HALF_SPEED_MS, SLOW_HALF_SPEED_MS);

/** The same race run the other way about, so the quickest kilometre is the last one. */
export const NEGATIVE_SPLIT_POINTS_MOCK: TrackPoint[] = buildRun(SLOW_HALF_SPEED_MS, FAST_HALF_SPEED_MS);

/** Fewer samples than the builder will look at. */
export const SPARSE_TRACK_POINTS_MOCK: TrackPoint[] = TRACK_POINTS_MOCK.slice(0, 5);

/** Enough samples, but a hundred metres of them — a watch stopped at the start line. */
export const SHORT_TRACK_POINTS_MOCK: TrackPoint[] = TRACK_POINTS_MOCK.slice(0, 20);

function buildRun(firstHalfSpeedMs: number, secondHalfSpeedMs: number): TrackPoint[] {
  const points: TrackPoint[] = [];

  for (let seconds = 0, meters = 0; meters <= HALF_DISTANCE_M * 2; seconds += 1) {
    points.push({ lat: START_LAT + meters / METERS_PER_DEGREE, lon: START_LON, secondsIn: seconds });
    meters += meters < HALF_DISTANCE_M ? firstHalfSpeedMs : secondHalfSpeedMs;
  }

  return points;
}

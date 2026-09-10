/**
 * Measures the course from the GPX recordings in `data/tracks`, so the distance the site does its
 * arithmetic on is an observation rather than a belief.
 *
 * Every recording is reported twice: as the receiver wrote it, and after a light smoothing of the
 * track. The gap between the two columns is the answer to «is the course longer than 5 km or is
 * the watch just wobbling» — noise only ever adds length, so the smoothed figure is the ceiling on
 * how much course there can actually be.
 *
 * Usage: npm run measure-course  (or `bun scripts/measure-course.ts [dir]` for another folder)
 */
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

interface TrackPoint {
  lat: number;
  lon: number;
  /** The watch's own odometer at this point, when the recording carries one. */
  watchMeters: number | null;
}

interface Measurement {
  name: string;
  totalMeters: number;
  smoothedMeters: number;
  watchMeters: number | null;
  legs: number[];
  watchLegs: number[];
}

const DEFAULT_DIR = 'data/tracks';

const EARTH_RADIUS_M = 6371008.8;

/** A pass this close to the start counts as crossing it — the alleys are narrower than this. */
const LAP_PROXIMITY_M = 25;

/** Ignore the first stretch, or the start line would register as its own crossing. */
const LAP_MIN_METERS = 400;

/**
 * How many neighbours each point is averaged with before the smoothed length is taken.
 *
 * One on either side, which is the mildest smoothing there is: it cancels the jitter of a single
 * sample and leaves every real corner of the course where it was. Widen it and the track starts
 * cutting the bends, which reports a course shorter than the one anybody ran.
 */
const SMOOTH_WINDOW = 1;

/** A recording covering anything but the course — a long run, a warm-up — is not evidence here. */
const PLAUSIBLE_RANGE_M = [4000, 6000];

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

function metersBetween(a: TrackPoint, b: TrackPoint): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * The points, each with the odometer the watch itself kept if the recording carries one.
 *
 * Worth reading rather than recomputing: a watch fuses satellites with the wrist's own motion, so
 * its figure is neither the raw polyline nor the truth — it is simply the number the runner saw,
 * which is where any belief about the course being long comes from in the first place.
 */
function parseTrack(xml: string): TrackPoint[] {
  return [...xml.matchAll(/<trkpt lat="([-\d.]+)" lon="([-\d.]+)"([\s\S]*?)<\/trkpt>/g)].map((match) => {
    const odometer = /<gpxdata:distance>([\d.]+)</.exec(match[3]);

    return { lat: Number(match[1]), lon: Number(match[2]), watchMeters: odometer === null ? null : Number(odometer[1]) };
  });
}

function polylineLength(points: readonly TrackPoint[]): number {
  return points.reduce((sum, point, index) => (index === 0 ? 0 : sum + metersBetween(points[index - 1], point)), 0);
}

function smoothed(points: readonly TrackPoint[]): TrackPoint[] {
  return points.map((_, index) => {
    const window = points.slice(Math.max(0, index - SMOOTH_WINDOW), index + SMOOTH_WINDOW + 1);

    return {
      lat: window.reduce((sum, point) => sum + point.lat, 0) / window.length,
      lon: window.reduce((sum, point) => sum + point.lon, 0) / window.length,
      watchMeters: null,
    };
  });
}

/** Distance covered up to each point, so a lap crossing can be quoted in metres. */
function cumulative(points: readonly TrackPoint[]): number[] {
  return points.reduce<number[]>((meters, point, index) => {
    meters.push(index === 0 ? 0 : meters[index - 1] + metersBetween(points[index - 1], point));

    return meters;
  }, []);
}

/** The point of the pass that comes nearest the start, not the first one inside the threshold. */
function closestApproach(points: readonly TrackPoint[], index: number): number {
  const start = points[0];
  let best = index;

  for (let i = index; i < points.length && metersBetween(start, points[i]) < LAP_PROXIMITY_M * 2; i++) {
    if (metersBetween(start, points[i]) < metersBetween(start, points[best])) {
      best = i;
    }
  }

  for (let i = index; i >= 0 && metersBetween(start, points[i]) < LAP_PROXIMITY_M * 2; i--) {
    if (metersBetween(start, points[i]) < metersBetween(start, points[best])) {
      best = i;
    }
  }

  return best;
}

/** Where the run comes back past its own start, plus the end — the boundaries of every leg. */
function legBoundaries(points: readonly TrackPoint[]): number[] {
  const meters = cumulative(points);
  const start = points[0];
  const marks: number[] = [];
  let wasAway = false;

  for (const [index, point] of points.entries()) {
    if (meters[index] < LAP_MIN_METERS) {
      continue;
    }

    const away = metersBetween(start, point) >= LAP_PROXIMITY_M;

    if (wasAway && !away) {
      marks.push(closestApproach(points, index));
    }

    wasAway = away;
  }

  marks.push(points.length - 1);

  return marks;
}

/** Each leg's length, read off whichever odometer is passed in. */
function legsAt(meters: readonly number[], boundaries: readonly number[]): number[] {
  return boundaries.map((index, position) => Math.round(meters[index] - (position === 0 ? 0 : meters[boundaries[position - 1]])));
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

async function measure(dir: string, name: string): Promise<Measurement | null> {
  const points = parseTrack(await readFile(join(dir, name), 'utf8'));

  if (points.length === 0) {
    return null;
  }

  const totalMeters = polylineLength(points);
  const [floor, ceiling] = PLAUSIBLE_RANGE_M;

  if (totalMeters < floor || totalMeters > ceiling) {
    console.warn(`${name}: ${Math.round(totalMeters)} m — not a recording of the course, skipped`);

    return null;
  }

  const boundaries = legBoundaries(points);
  const watch = points.map((point) => point.watchMeters ?? Number.NaN);
  const hasWatch = !watch.some(Number.isNaN);

  return {
    name,
    totalMeters,
    smoothedMeters: polylineLength(smoothed(points)),
    watchMeters: hasWatch ? watch[watch.length - 1] : null,
    legs: legsAt(cumulative(points), boundaries),
    watchLegs: hasWatch ? legsAt(watch, boundaries) : [],
  };
}

/** Big laps only — the short one that tops the course up is a different animal. */
function bigLaps(item: Measurement): number[] {
  return item.legs.slice(0, -1);
}

function report(measurements: readonly Measurement[]): void {
  for (const item of measurements) {
    const watch = item.watchMeters === null ? '' : `  watch ${Math.round(item.watchMeters)} m`;

    console.info(
      `${item.name}  raw ${Math.round(item.totalMeters)} m  smoothed ${Math.round(item.smoothedMeters)} m${watch}` +
        `\n  legs ${item.legs.join(' + ')}${item.watchLegs.length === 0 ? '' : `   by watch ${item.watchLegs.join(' + ')}`}`,
    );
  }

  const watched = measurements.filter((item) => item.watchMeters !== null);
  const lapLegs = measurements.flatMap(bigLaps);

  console.info(
    [
      '',
      `recordings ${measurements.length}`,
      `median raw total     ${Math.round(median(measurements.map((item) => item.totalMeters)))} m`,
      `median smoothed      ${Math.round(median(measurements.map((item) => item.smoothedMeters)))} m`,
      ...(watched.length === 0 ? [] : [`median by watch      ${Math.round(median(watched.map((item) => item.watchMeters ?? 0)))} m`]),
      `median big lap       ${Math.round(median(lapLegs))} m`,
    ].join('\n'),
  );
}

async function main(): Promise<void> {
  const dir = process.argv[2] ?? DEFAULT_DIR;
  const names = (await readdir(dir)).filter((name) => name.endsWith('.gpx')).sort();

  if (names.length === 0) {
    throw new Error(`no .gpx files in ${dir}`);
  }

  const measurements = (await Promise.all(names.map((name) => measure(dir, name)))).filter((item) => item !== null);

  if (measurements.length === 0) {
    throw new Error(`none of the ${names.length} recordings in ${dir} covers the course`);
  }

  report(measurements);
}

await main();

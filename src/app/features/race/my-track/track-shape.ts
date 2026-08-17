import { TrackSample } from '../../../core/track/track-point.interface';
import { TrackRun } from '../../../core/track/track-run.interface';
import { COURSE_GEO_FRAME } from '../../home/course-track/course-geometry.constant';
import { COORD_TENTHS_BASE, PACE_TONE_BANDS, TRACE_MIN_STEP_UNITS } from './my-track.constant';
import { TrackFrame, TrackTrace } from './my-track.interface';
import { PaceTone, PaceToneType } from './pace-tone.enum';

/**
 * Where a point of a personal recording lands on the course map.
 *
 * The map was fitted to one GPS recording of the course and carries the projection that fitted it,
 * so a second recording of the same park needs no alignment of its own: run through these four
 * numbers, an athlete's own track lies on the same alleys the drawn route does.
 */
export function projectToCourse(point: { lat: number; lon: number }): { x: number; y: number } {
  return {
    x: point.lon * COURSE_GEO_FRAME.lonScale + COURSE_GEO_FRAME.lonOffset,
    y: point.lat * COURSE_GEO_FRAME.latScale + COURSE_GEO_FRAME.latOffset,
  };
}

/** The recording as drawable points: thinned to what a screen can show, each with its pace band. */
export function buildFrames(run: TrackRun): TrackFrame[] {
  return thin(run.samples.map((sample) => toFrame(sample, run.paceMs)));
}

/**
 * The route cut into stretches of one pace band each, in the order they were run.
 *
 * In the order they were run, and not gathered by colour, because the course is two laps of the
 * same alleys: whatever is drawn last covers what is underneath it. Grouped by band, the slowest
 * paths would be painted over every quicker one they crossed, and the map would report a race
 * slower than it was. Chronological, the second lap simply lies over the first — which is what
 * actually happened.
 *
 * Every stretch starts from the point before it, so the colours meet on the line instead of
 * leaving a gap wherever the pace changed.
 */
export function buildTraces(frames: TrackFrame[]): TrackTrace[] {
  const stretches: { tone: PaceToneType; points: TrackFrame[] }[] = [];

  for (let index = 1; index < frames.length; index += 1) {
    const tone = frames[index].tone;
    const current = stretches[stretches.length - 1];

    if (current?.tone === tone) {
      current.points.push(frames[index]);
    } else {
      stretches.push({ tone, points: [frames[index - 1], frames[index]] });
    }
  }

  return stretches.map((stretch) => ({ tone: stretch.tone, d: toPathData(stretch.points) }));
}

/** Which band a stretch belongs to, as a fraction of the run's own average pace. */
function toneOf(paceMs: number, averageMs: number): PaceToneType {
  const ratio = paceMs / averageMs;

  return PACE_TONE_BANDS.find((band) => ratio < band.under)?.tone ?? PaceTone.slowest;
}

function toFrame(sample: TrackSample, averageMs: number): TrackFrame {
  return {
    ...projectToCourse(sample),
    secondsIn: sample.secondsIn,
    metersIn: sample.metersIn,
    paceMs: sample.paceMs,
    tone: toneOf(sample.paceMs, averageMs),
  };
}

/**
 * Drops the samples that would land on top of their neighbour once drawn. The first and the last
 * are always kept: they are the start line and the finish, and no thinning may move either.
 */
function thin(frames: TrackFrame[]): TrackFrame[] {
  const kept = [frames[0]];

  for (let index = 1; index < frames.length - 1; index += 1) {
    if (apart(kept[kept.length - 1], frames[index])) {
      kept.push(frames[index]);
    }
  }

  kept.push(frames[frames.length - 1]);

  return kept;
}

function apart(from: TrackFrame, to: TrackFrame): boolean {
  return Math.hypot(to.x - from.x, to.y - from.y) >= TRACE_MIN_STEP_UNITS;
}

/** `M…L…` at a tenth of a unit — well under a rendered pixel, and half the characters. */
function toPathData(points: TrackFrame[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${round(point.x)} ${round(point.y)}`).join('');
}

function round(value: number): number {
  return Math.round(value * COORD_TENTHS_BASE) / COORD_TENTHS_BASE;
}

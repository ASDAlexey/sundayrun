import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import {
  COURSE_ALLEY_PATH,
  COURSE_ARROWS,
  COURSE_LANDMARKS,
  COURSE_MARKS,
  COURSE_FINAL_LAP_PATH,
  COURSE_FINISH_POINT,
  COURSE_LAP_ONE_END_FRACTION,
  COURSE_LAP_ONE_PATH,
  COURSE_LAP_TWO_END_FRACTION,
  COURSE_LAP_TWO_PATH,
  COURSE_RUN_PATH,
  COURSE_START_POINT,
  COURSE_VIEW_BOX,
} from './course-geometry.constant';
import {
  COURSE_LAP_MARK_SHIFT,
  COURSE_MEETING_OFFSET,
  COURSE_MEETING_RADIUS,
  COURSE_PIN_RADIUS,
  COURSE_PLAY_SECONDS,
  COURSE_RUNNER_RADIUS,
  COURSE_TOTAL_METERS,
} from './course-track.constant';

/**
 * The course as a map you can watch someone run.
 *
 * At rest it is simply the whole course: the park's alleys underneath, both laps drawn as
 * parallel ribbons, start and finish pinned. Press the button and a marker runs the 5 km
 * while the distance counts up beside it.
 *
 * It began as a scroll-driven flyover with a camera chasing the marker, and that was wrong
 * twice over. The camera had to zoom in to follow, which meant you never saw the course you
 * came to look at; and tying it to the scrollbar held three screens hostage on a page people
 * open every week for the protocol. On a button it is opt-in, the whole course stays in
 * frame, the page is short again — and it no longer depends on scroll-driven animations, so
 * it works in Firefox too.
 *
 * Replay works by rebuilding the animated group: `@for` over `attempts` gives the elements a
 * new identity, and a CSS animation restarts when its element does. Nudging a class or a
 * custom property would not — the browser has no reason to replay an animation it is
 * already running.
 */
@Component({
  selector: 'app-course-track',
  templateUrl: './course-track.html',
  styleUrl: './course-track.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseTrack {
  readonly #attempt = signal(0);

  protected readonly viewBox = COURSE_VIEW_BOX;
  protected readonly alleyPath = COURSE_ALLEY_PATH;
  protected readonly lapOnePath = COURSE_LAP_ONE_PATH;
  protected readonly lapTwoPath = COURSE_LAP_TWO_PATH;
  protected readonly finalLapPath = COURSE_FINAL_LAP_PATH;
  protected readonly startPoint = COURSE_START_POINT;
  protected readonly finishPoint = COURSE_FINISH_POINT;
  protected readonly runnerRadius = COURSE_RUNNER_RADIUS;
  protected readonly pinRadius = COURSE_PIN_RADIUS;
  protected readonly meetingRadius = COURSE_MEETING_RADIUS;
  protected readonly totalMeters = COURSE_TOTAL_METERS;
  protected readonly arrows = COURSE_ARROWS;

  /**
   * The marks, with the balloon's own position alongside the point it stands for: the kilometres
   * sit on their point, the lap slides off it towards its label to clear the start disc.
   */
  protected readonly marks = COURSE_MARKS.map((mark) => ({
    ...mark,
    bx: mark.lap > 0 ? mark.x + (mark.lx - mark.x) * COURSE_LAP_MARK_SHIFT : mark.x,
    by: mark.lap > 0 ? mark.y + (mark.ly - mark.y) * COURSE_LAP_MARK_SHIFT : mark.y,
  }));

  protected readonly meetingPoint = {
    x: COURSE_START_POINT.x + COURSE_MEETING_OFFSET.x,
    y: COURSE_START_POINT.y + COURSE_MEETING_OFFSET.y,
  };

  /** The chequer is drawn about the disc's own origin, so the disc is placed rather than centred. */
  protected readonly finishTransform = at(COURSE_FINISH_POINT);
  protected readonly meetingTransform = at(this.meetingPoint);

  /**
   * From the gathering point down onto the line, as a shaft and a head rather than a marker: an
   * SVG marker inherits its own scale from the stroke, and the stroke here is hairline. Both ends
   * are held clear of the discs they join, so the arrow reads as a link and not as a tail.
   */
  protected readonly meetingArrow = arrowBetween(this.meetingPoint, COURSE_START_POINT, 19, 16);
  /**
   * Landmarks with their glyph resolved to a fragment reference and their position expressed as
   * a percentage of the frame.
   *
   * The percentages are what let the names live in HTML instead of inside the SVG. Text drawn in
   * the SVG is measured in viewBox units, so it scales with the map — the same label was twelve
   * pixels on a laptop and four on a phone, and its halo thinned out with it. Positioned over
   * the map instead, a label is a real element at a real size, with a real background behind it.
   */
  protected readonly landmarks = COURSE_LANDMARKS.map((place) => ({
    ...place,
    symbol: `#course-icon-${place.icon}`,
    left: percentOf(place.x, VIEW_WIDTH),
    top: percentOf(place.y, VIEW_HEIGHT),
  }));

  protected readonly meetingLabel = {
    left: percentOf(COURSE_START_POINT.x + COURSE_MEETING_OFFSET.x, VIEW_WIDTH),
    top: percentOf(COURSE_START_POINT.y + COURSE_MEETING_OFFSET.y, VIEW_HEIGHT),
  };

  protected readonly startLabel = {
    left: percentOf(COURSE_START_POINT.x, VIEW_WIDTH),
    top: percentOf(COURSE_START_POINT.y, VIEW_HEIGHT),
  };

  protected readonly finishLabel = {
    left: percentOf(COURSE_FINISH_POINT.x, VIEW_WIDTH),
    top: percentOf(COURSE_FINISH_POINT.y, VIEW_HEIGHT),
  };

  /** `offset-path` needs the literal geometry, so the route reaches CSS as a bound value. */
  protected readonly runOffsetPath = `path('${COURSE_RUN_PATH}')`;

  protected readonly playing = signal(false);

  /** True once a run has finished, so the button can offer another instead of the first. */
  protected readonly replayable = signal(false);

  /**
   * Alternates between two identical sets of keyframes, one per press.
   *
   * A CSS animation restarts when its `animation-name` changes and at no other moment: toggling
   * a class or bumping a custom property leaves the browser running the animation it already
   * has. Rebuilding the elements would also work, but destroying and recreating a hundred-odd
   * path nodes to replay a picture is a lot of DOM for an effect.
   */
  protected readonly alternateTake = computed(() => this.#attempt() % 2 === 1);

  protected readonly playSeconds = `${COURSE_PLAY_SECONDS}s`;

  // Each lap animates over its own slice of the run, taken from where the marker actually
  // reaches it. Hand-picked timings would drift away from the geometry the moment the
  // recording is replaced.
  protected readonly lapOneTiming = computed(() => timing(0, COURSE_LAP_ONE_END_FRACTION));
  protected readonly lapTwoTiming = computed(() => timing(COURSE_LAP_ONE_END_FRACTION, COURSE_LAP_TWO_END_FRACTION));
  protected readonly lapFinalTiming = computed(() => timing(COURSE_LAP_TWO_END_FRACTION, 1));

  protected play(): void {
    this.#attempt.update((attempt) => attempt + 1);
    this.playing.set(true);
  }

  /**
   * The finished state and the resting state are the same picture — course fully drawn, the
   * distance back at 5000 — so stopping needs no transition, just the flag going down.
   */
  protected onRunEnd(): void {
    this.playing.set(false);
    this.replayable.set(true);
  }
}

/** A slice of the play-through as CSS `delay` and `duration`, in seconds. */
/**
 * The frame, parsed once from the generated viewBox so the overlay and the drawing cannot drift
 * apart: both read the same two numbers.
 */
const [VIEW_WIDTH, VIEW_HEIGHT] = COURSE_VIEW_BOX.split(' ').slice(2).map(Number);

function at(point: { x: number; y: number }): string {
  return `translate(${point.x} ${point.y})`;
}

/**
 * A shaft and a rotated head running from one point to another, each end held back by its own
 * clearance so the arrow starts outside the first mark and stops outside the second.
 *
 * The head is drawn pointing down and turned into place: `atan2(-dx, dy)` is the angle that takes
 * SVG's downward axis onto the shaft, remembering that y grows towards the bottom of the map.
 */
function arrowBetween(
  from: { x: number; y: number },
  to: { x: number; y: number },
  fromClearance: number,
  toClearance: number,
): { shaft: string; head: string } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // No guard against a zero length: the only arrow drawn here spans the gathering offset, and an
  // offset of nothing would leave nothing to point at in the first place.
  const length = Math.hypot(dx, dy);
  const ux = dx / length;
  const uy = dy / length;
  const tip = { x: to.x - ux * toClearance, y: to.y - uy * toClearance };

  return {
    shaft: `M${(from.x + ux * fromClearance).toFixed(1)} ${(from.y + uy * fromClearance).toFixed(1)} L${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`,
    head: `${at({ x: Number(tip.x.toFixed(1)), y: Number(tip.y.toFixed(1)) })} rotate(${((Math.atan2(-dx, dy) * 180) / Math.PI).toFixed(1)})`,
  };
}

function percentOf(value: number, extent: number): string {
  return `${((value / extent) * 100).toFixed(3)}%`;
}

function timing(from: number, to: number): { delay: string; duration: string } {
  return {
    delay: `${(from * COURSE_PLAY_SECONDS).toFixed(2)}s`,
    duration: `${((to - from) * COURSE_PLAY_SECONDS).toFixed(2)}s`,
  };
}

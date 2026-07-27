import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, inject, signal } from '@angular/core';

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
  COURSE_AUTOPLAY_OBSERVER_OPTIONS,
  COURSE_LAP_MARK_SHIFT,
  COURSE_MEETING_OFFSET,
  COURSE_PIN_RADIUS,
  COURSE_REDUCED_MOTION_QUERY,
  COURSE_PLAY_SECONDS,
  COURSE_RUNNER_RADIUS,
  COURSE_TOTAL_METERS,
} from './course-track.constant';

/**
 * The course as a map you can watch someone run.
 *
 * At rest it is simply the whole course: the park's alleys underneath, both laps drawn as
 * parallel ribbons, start and finish pinned. Scroll it into the frame and a marker runs the
 * 5 km while the distance counts up on the plate in the corner; the button replays it.
 *
 * It began as a scroll-driven flyover with a camera chasing the marker, and that was wrong
 * twice over. The camera had to zoom in to follow, which meant you never saw the course you
 * came to look at; and tying it to the scrollbar held three screens hostage on a page people
 * open every week for the protocol. Playing it once on arrival keeps the whole course in
 * frame and the page short, and it depends on no scroll-driven animation, so Firefox gets it
 * too — while the run itself, the thing worth seeing, no longer waits for a click nobody
 * knew to make.
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
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
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

  /**
   * True from the first run onwards, so the button offers another instead of the first.
   *
   * Set when the run starts rather than when it ends: with the map playing itself on arrival, a
   * button still reading «посмотреть, как по ней бежать» would be inviting the visitor to watch
   * what they are already watching.
   */
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

  constructor() {
    afterNextRender(() => this.#armAutoplay());
  }

  protected play(): void {
    this.#attempt.update((attempt) => attempt + 1);
    this.playing.set(true);
    this.replayable.set(true);
  }

  /**
   * The finished state and the resting state are the same picture — course fully drawn, the
   * distance back at 5000 — so stopping needs no transition, just the flag going down.
   */
  protected onRunEnd(): void {
    this.playing.set(false);
  }

  /**
   * Plays the run once, when enough of the map is on screen to be worth watching.
   *
   * Disconnects on the first showing: a map that replays itself every time it scrolls back past
   * the fold is a page that will not settle, and the button is right there for a second look.
   * Skipped entirely when the visitor has asked for less motion — the same rule that hides the
   * button, since the animation is the whole of what either would do.
   */
  #armAutoplay(): void {
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) {
        return;
      }

      observer.disconnect();
      this.play();
    }, COURSE_AUTOPLAY_OBSERVER_OPTIONS);

    observer.observe(this.#host.nativeElement);
  }
}

/** Guarded because `matchMedia` is missing in jsdom and in any non-browser DOM shim. */
function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia(COURSE_REDUCED_MOTION_QUERY).matches;
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

function percentOf(value: number, extent: number): string {
  return `${((value / extent) * 100).toFixed(3)}%`;
}

function timing(from: number, to: number): { delay: string; duration: string } {
  return {
    delay: `${(from * COURSE_PLAY_SECONDS).toFixed(2)}s`,
    duration: `${((to - from) * COURSE_PLAY_SECONDS).toFixed(2)}s`,
  };
}

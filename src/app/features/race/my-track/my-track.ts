import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { gunzipSync, strFromU8 } from 'fflate';

import { formatDuration } from '../../../core/time/duration';
import { MS_IN_SECOND } from '../../../core/time/duration.constant';
import { parseGpx } from '../../../core/track/parse-gpx';
import { buildTrackRun } from '../../../core/track/track-run';
import { readTrack } from '../../../state/athlete-track.storage';
import { COURSE_AUTOPLAY_OBSERVER_OPTIONS, COURSE_REDUCED_MOTION_QUERY } from '../../home/course-track/course-track.constant';
import { RaceTime } from '../../../shared/race-time/race-time';
import { CHART_HEIGHT, CHART_PAD, CHART_WIDTH, MARKER_MIN_SPAN_S, MARKER_RADIUS, PIN_RADIUS, REPLAY_SECONDS } from './my-track.constant';
import { MyTrackView, TrackFrame, TrackMarker } from './my-track.interface';

/**
 * «Твой трек» — the athlete's own recording of this race, drawn on the course map.
 *
 * The protocol says when you finished; this says how. The line is coloured by pace against your own
 * average, so the third kilometre going red is the whole story told without a word, and the marker
 * replays the race on the run's own clock — it slows down where you did.
 *
 * The card exists only where the recording does. Tracks live in this device's IndexedDB and are
 * never uploaded, so nobody else's browser can draw this, and on a device that never linked a watch
 * the card is simply absent — which is also why it says nothing about anyone but the reader.
 */
@Component({
  selector: 'app-my-track',
  imports: [RaceTime],
  templateUrl: './my-track.html',
  styleUrl: './my-track.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyTrack {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #destroyRef = inject(DestroyRef);

  /** The race being read — one recording per race, keyed by the same slug the archive uses. */
  readonly slug = input.required<string>();

  /** The reader's official time for this race, when they are picked as «себя»; null otherwise. */
  readonly officialMs = input<number | null>(null);

  readonly view = signal<MyTrackView | null>(null);
  readonly playing = signal(false);
  readonly replayable = signal(false);

  /** How far into the recording the replay has got, in the run's own seconds. */
  readonly playedSeconds = signal(0);

  /** Where the marker is, and what it is doing — null whenever the map is at rest. */
  readonly marker = computed<TrackMarker | null>(() => {
    const view = this.view();

    return view === null || !this.playing() ? null : markerAt(view.frames, this.playedSeconds());
  });

  protected readonly markerRadius = MARKER_RADIUS;
  protected readonly pinRadius = PIN_RADIUS;

  protected readonly chartViewBox = `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`;
  protected readonly chartTop = CHART_PAD;
  protected readonly chartBottom = CHART_HEIGHT - CHART_PAD;
  protected readonly chartLeft = CHART_PAD;
  protected readonly chartRight = CHART_WIDTH - CHART_PAD;

  /** The frame loop driving the replay, or 0 when nothing is moving. */
  #frame = 0;

  constructor() {
    effect(() => {
      void this.#load(this.slug(), this.officialMs());
    });

    afterNextRender(() => this.#armAutoplay());
    this.#destroyRef.onDestroy(() => this.#stop());
  }

  /**
   * Runs the recording through in `REPLAY_SECONDS`, keeping its own shape: the marker covers the
   * kilometre you ran quickest in less screen time than the one you laboured over.
   */
  play(): void {
    const view = this.view();

    if (view === null) {
      return;
    }

    this.#stop();
    this.playing.set(true);
    this.replayable.set(true);

    let startedAt: number | undefined;

    const tick = (now: number): void => {
      startedAt ??= now;

      const played = Math.min((now - startedAt) / (REPLAY_SECONDS * MS_IN_SECOND), 1);

      this.playedSeconds.set(played * view.totalSeconds);

      if (played < 1) {
        this.#frame = requestAnimationFrame(tick);

        return;
      }

      // Finished and at rest are the same picture — the whole track drawn, the plate on the full
      // distance — so the end of the replay is just the flag going down.
      this.#frame = 0;
      this.playing.set(false);
    };

    this.#frame = requestAnimationFrame(tick);
  }

  /**
   * Reads this device's recording of the race, if it holds one.
   *
   * Every failure lands on the same answer — no card. There is no track for this race, the browser
   * refused IndexedDB, the file came back unreadable: none of them is something the reader can act
   * on, and a protocol page is not the place to explain a watch.
   *
   * The drawing is fetched rather than imported: the builder pulls in the course geometry, sixteen
   * kilobytes of park that every reader without a watch would otherwise be paying for on a page
   * they open every week.
   */
  async #load(slug: string, officialMs: number | null): Promise<void> {
    const track = await readTrack(slug);

    // A navigation to another race can land while this read is in flight; the newer race wins.
    if (this.slug() !== slug) {
      return;
    }

    this.#stop();
    this.playing.set(false);
    this.replayable.set(false);
    this.playedSeconds.set(0);

    const run = track === null ? null : buildTrackRun(parseGpx(strFromU8(gunzipSync(track.gpxGzip))), officialMs);

    if (run === null) {
      this.view.set(null);

      return;
    }

    const { buildMyTrackView } = await import('./my-track-view');

    this.view.set(buildMyTrackView(run));
  }

  /** Plays once when the map is properly on screen, unless the visitor asked for less motion. */
  #armAutoplay(): void {
    if (typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting || this.view() === null) {
        return;
      }

      observer.disconnect();
      this.play();
    }, COURSE_AUTOPLAY_OBSERVER_OPTIONS);

    observer.observe(this.#host.nativeElement);
    this.#destroyRef.onDestroy(() => observer.disconnect());
  }

  #stop(): void {
    if (this.#frame) {
      cancelAnimationFrame(this.#frame);
      this.#frame = 0;
    }
  }
}

/**
 * The marker at one instant of the run, interpolated between the two samples either side of it.
 *
 * The span is floored rather than tested: a watch that logged two points in the same second would
 * otherwise divide by zero, and clamping the ratio puts the marker on the later of the two, which
 * is where it was going anyway.
 */
function markerAt(frames: TrackFrame[], seconds: number): TrackMarker {
  const found = frames.findIndex((frame) => frame.secondsIn >= seconds);
  const index = Math.min(Math.max(found, 1), frames.length - 1);
  const before = frames[index - 1];
  const after = frames[index];
  const span = Math.max(after.secondsIn - before.secondsIn, MARKER_MIN_SPAN_S);
  const ratio = Math.min(Math.max((seconds - before.secondsIn) / span, 0), 1);

  return {
    x: before.x + (after.x - before.x) * ratio,
    y: before.y + (after.y - before.y) * ratio,
    meters: Math.round(before.metersIn + (after.metersIn - before.metersIn) * ratio),
    paceText: formatDuration(after.paceMs),
  };
}

/** Guarded because `matchMedia` is missing in jsdom and in any non-browser DOM shim. */
function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia(COURSE_REDUCED_MOTION_QUERY).matches;
}

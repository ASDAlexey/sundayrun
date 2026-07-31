import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';

import { EventPhoto } from '../../../core/models/event-photo.interface';
import { PHOTO_STRIP_VISIBLE_COUNT, PHOTO_VIEWER_CLOSE_KEY } from './photo-strip.constant';
import { PhotoTileView, SwiperSlideChangeEvent } from './photo-strip.interface';
import { SWIPER_LOADER } from './swiper-loader.token';

/**
 * The template hands a custom element's event over as a bare `Event`, and type assertions are
 * banned in this codebase, so the Swiper payload is narrowed by shape instead.
 */
function isSlideChangeEvent(event: Event): event is SwiperSlideChangeEvent {
  return event instanceof CustomEvent && Array.isArray(event.detail);
}

/**
 * The protocol's photo strip: three thumbnails of the race's VK post, the last one carrying a «+N»
 * when the post holds more, and a Swiper viewer that pages through every stored photograph.
 *
 * The images are never copied into this repository — every `img` points straight at VK's CDN, so
 * the first visit downloads them once and every later visit is served by the browser's own HTTP
 * cache. A tile therefore starts as a shimmering placeholder and reveals its image on `load`.
 *
 * VK signs those urls and they can rot. A thumbnail that fails to load is dropped from the strip
 * rather than left as a broken square. A full-size one that fails only replaces its own slide with
 * a notice — the slide itself stays, because pulling a child out from under Swiper mid-gesture is
 * what makes a carousel jump.
 *
 * Swiper arrives through {@link SWIPER_LOADER} on the first open — see `swiper-loader` for why it
 * is not a static import — and brings the swipe, the arrows and the ←/→ keys with it. Escape stays ours.
 */
@Component({
  selector: 'app-photo-strip',
  templateUrl: './photo-strip.html',
  styleUrl: './photo-strip.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onKeydown($event)' },
  // `swiper-container` / `swiper-slide` are custom elements; their styles live in shadow DOM.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PhotoStrip {
  readonly #loadSwiper = inject(SWIPER_LOADER);

  /** Thumbnail indices whose CDN url did not resolve — dropped from the strip and the viewer alike. */
  readonly #broken = signal<ReadonlySet<number>>(new Set());

  /** Indices whose full-size url failed; their slide shows a notice instead of a blank frame. */
  readonly #brokenLarge = signal<ReadonlySet<number>>(new Set());

  /** Thumbnails the browser has actually painted — until then the tile shows its sheen. */
  readonly #loaded = signal<ReadonlySet<number>>(new Set());

  readonly photos = input.required<EventPhoto[]>();

  /** The wall post itself — the viewer links out to it, so the visitor can see the full album. */
  readonly postUrl = input<string>('');

  /** The live position the viewer opened at, or null when it is closed. */
  readonly openPosition = signal<number | null>(null);

  /** True once Swiper's custom elements are defined; until then the viewer holds off rendering. */
  readonly swiperReady = signal(false);

  /** Every photo whose thumbnail still resolves — the viewer pages through exactly these. */
  readonly livePhotos = computed(() =>
    this.photos().reduce<EventPhoto[]>((kept, photo, index) => (this.#broken().has(index) ? kept : [...kept, photo]), []),
  );

  readonly tiles = computed((): PhotoTileView[] => {
    const broken = this.#broken();
    const loaded = this.#loaded();
    const live = this.photos().reduce<{ photo: EventPhoto; index: number }[]>(
      (kept, photo, index) => (broken.has(index) ? kept : [...kept, { photo, index }]),
      [],
    );
    const visible = live.slice(0, PHOTO_STRIP_VISIBLE_COUNT);

    return visible.map((tile, position) => ({
      photo: tile.photo,
      index: tile.index,
      hiddenCount: position === visible.length - 1 ? live.length - visible.length : 0,
      /** The viewer opens by live position, which is what Swiper counts in. */
      livePosition: position,
      loaded: loaded.has(tile.index),
    }));
  });

  /** The slides Swiper renders: every live photo, each knowing whether its full size resolved. */
  readonly slides = computed(() =>
    this.photos().reduce<{ photo: EventPhoto; index: number; failed: boolean }[]>(
      (kept, photo, index) => (this.#broken().has(index) ? kept : [...kept, { photo, index, failed: this.#brokenLarge().has(index) }]),
      [],
    ),
  );

  readonly isOpen = computed(() => this.openPosition() !== null);

  /** «3 / 12» — the human-readable position, tracked as Swiper slides. */
  readonly positionLabel = computed(() => `${(this.openPosition() ?? 0) + 1} / ${this.livePhotos().length}`);

  /** Where the viewer's «Открыть во ВКонтакте» goes: the wall post, or the open photo's own page. */
  readonly sourceUrl = computed(() => {
    const photo = this.livePhotos()[this.openPosition() ?? 0];

    return this.postUrl() || (photo?.photoUrl ?? '');
  });

  /** Opens the viewer at a live position, fetching Swiper's chunk the first time round. */
  async open(livePosition: number): Promise<void> {
    this.openPosition.set(livePosition);

    await this.#loadSwiper();

    this.swiperReady.set(true);
  }

  close(): void {
    this.openPosition.set(null);
  }

  /** Swiper drives the position from here on: swipes, its arrows and the ←/→ keys all land here. */
  onSlideChange(event: Event): void {
    if (!isSlideChangeEvent(event)) {
      return;
    }

    const [swiper] = event.detail;

    this.openPosition.set(swiper.activeIndex);
  }

  /** The thumbnail arrived: the sheen stops and the photograph fades in over its frame. */
  markLoaded(index: number): void {
    this.#loaded.update((loaded) => new Set(loaded).add(index));
  }

  /** A thumbnail VK no longer serves: drop it, and close the viewer rather than renumber under it. */
  markBroken(index: number): void {
    this.#broken.update((broken) => new Set(broken).add(index));
    this.close();
  }

  /** A full-size url that failed: its slide swaps to a notice, the carousel keeps its shape. */
  markLargeBroken(index: number): void {
    this.#brokenLarge.update((broken) => new Set(broken).add(index));
  }

  /** Escape closes; the arrow keys belong to Swiper's own keyboard module. */
  onKeydown(event: KeyboardEvent): void {
    if (this.isOpen() && event.key === PHOTO_VIEWER_CLOSE_KEY) {
      this.close();
    }
  }
}

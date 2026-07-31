import { DOCUMENT } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PHOTO_STRIP_VISIBLE_COUNT, PHOTO_VIEWER_CLOSE_KEY } from './photo-strip.constant';
import { PhotoStrip } from './photo-strip';
import {
  PHOTO_STRIP_EXPECTED_HIDDEN_COUNT,
  PHOTO_STRIP_PHOTOS,
  PHOTO_STRIP_POST_URL,
  PHOTO_STRIP_SINGLE_PHOTO,
  slideChangeEvent,
} from './photo-strip.mock';
import { SWIPER_LOADER } from './swiper-loader.token';

describe('PhotoStrip', () => {
  let fixture: ComponentFixture<PhotoStrip>;

  beforeEach(() => {
    // Swiper defines global custom elements and needs a real layout engine; the viewer only cares
    // that the chunk resolved, so the loader is stubbed and `swiper-container` stays inert.
    TestBed.configureTestingModule({ providers: [{ provide: SWIPER_LOADER, useValue: () => Promise.resolve() }] });
  });

  afterEach(() => {
    fixture.destroy();
  });

  /** Renders the strip over the given photos and returns the component with its DOM settled. */
  function createStrip(photos = PHOTO_STRIP_PHOTOS, postUrl = PHOTO_STRIP_POST_URL): PhotoStrip {
    fixture = TestBed.createComponent(PhotoStrip);
    fixture.componentRef.setInput('photos', photos);
    fixture.componentRef.setInput('postUrl', postUrl);
    fixture.detectChanges();

    return fixture.componentInstance;
  }

  /** Opens the viewer and lets the stubbed Swiper import settle, so its slides render. */
  async function openAt(strip: PhotoStrip, livePosition: number): Promise<void> {
    await strip.open(livePosition);
    fixture.detectChanges();
  }

  it('shows three thumbnails with the remainder collapsed into the last tile and opens Swiper on click', async () => {
    const strip = createStrip();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelectorAll('.photo-strip__image').length, 'the strip caps at three squares').toBe(PHOTO_STRIP_VISIBLE_COUNT);
    expect(element.querySelector('.photo-strip__more')?.textContent?.trim(), 'the last tile counts what it hides').toBe(
      `+${PHOTO_STRIP_EXPECTED_HIDDEN_COUNT}`,
    );
    expect(element.querySelector('.photo-viewer'), 'the viewer stays closed until a tile is clicked').toBeNull();
    expect(element.querySelectorAll('.photo-strip__tile_loading').length, 'every frame starts as a placeholder').toBe(
      PHOTO_STRIP_VISIBLE_COUNT,
    );

    element.querySelectorAll('.photo-strip__image')[0].dispatchEvent(new Event('load'));
    fixture.detectChanges();

    expect(element.querySelectorAll('.photo-strip__tile_loading').length, 'the arrived thumbnail drops its sheen').toBe(
      PHOTO_STRIP_VISIBLE_COUNT - 1,
    );
    expect(element.querySelector('.photo-strip__image_loaded'), 'and fades in').not.toBeNull();

    element.querySelectorAll<HTMLButtonElement>('.photo-strip__tile')[2].click();
    await fixture.whenStable();
    fixture.detectChanges();

    const swiper = element.querySelector('swiper-container');

    expect(strip.openPosition()).toBe(2);
    expect(swiper?.getAttribute('initial-slide'), 'Swiper opens on the clicked photo').toBe('2');
    expect(swiper?.getAttribute('keyboard'), 'the arrow keys belong to Swiper').toBe('true');
    expect(
      [...element.querySelectorAll('.photo-viewer__image')].map((image) => image.getAttribute('src')),
      'every live photo becomes a slide',
    ).toEqual(PHOTO_STRIP_PHOTOS.map((photo) => photo.largeUrl));
    expect(element.querySelector('.photo-viewer__position')?.textContent?.trim()).toBe(`3 / ${PHOTO_STRIP_PHOTOS.length}`);
    expect(element.querySelector('.photo-viewer__source')?.getAttribute('href'), 'the escape hatch is the wall post').toBe(
      PHOTO_STRIP_POST_URL,
    );
  });

  it('follows Swiper as it slides and closes on Escape, ignoring the key while shut', async () => {
    const strip = createStrip();
    const element: HTMLElement = fixture.nativeElement;
    const document = TestBed.inject(DOCUMENT);

    await openAt(strip, 0);

    element.querySelector('swiper-container')?.dispatchEvent(slideChangeEvent(4));
    fixture.detectChanges();

    expect(strip.openPosition(), 'the swipe drives the position').toBe(4);
    expect(element.querySelector('.photo-viewer__position')?.textContent?.trim()).toBe(`5 / ${PHOTO_STRIP_PHOTOS.length}`);

    element.querySelector('swiper-container')?.dispatchEvent(new Event('swiperslidechange'));
    fixture.detectChanges();

    expect(strip.openPosition(), 'an event without Swiper’s payload is ignored').toBe(4);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: PHOTO_VIEWER_CLOSE_KEY }));
    fixture.detectChanges();

    expect(strip.openPosition(), 'Escape closes the viewer').toBeNull();
    expect(element.querySelector('.photo-viewer'), 'and the overlay leaves the DOM').toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: PHOTO_VIEWER_CLOSE_KEY }));

    expect(strip.openPosition(), 'a second Escape has nothing to close').toBeNull();
  });

  it('drops a thumbnail VK stopped serving and swaps a failed full-size slide for a notice', async () => {
    const strip = createStrip();
    const element: HTMLElement = fixture.nativeElement;

    await openAt(strip, 1);

    element.querySelector('.photo-viewer__image')?.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(element.querySelector('.photo-viewer__failed'), 'the dead slide explains itself').not.toBeNull();
    expect(strip.openPosition(), 'and the carousel keeps its place').toBe(1);

    strip.close();
    fixture.detectChanges();

    element.querySelectorAll('.photo-strip__image')[0].dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(strip.livePhotos().length, 'the rotted thumbnail is dropped from the live set').toBe(PHOTO_STRIP_PHOTOS.length - 1);
    expect(
      element.querySelector<HTMLImageElement>('.photo-strip__image')?.getAttribute('src'),
      'the strip closes ranks — the next photo takes the first square',
    ).toBe(PHOTO_STRIP_PHOTOS[1].previewUrl);

    expect(
      strip.slides().map((slide) => slide.photo),
      'and a reopened viewer pages through the survivors alone',
    ).toEqual(PHOTO_STRIP_PHOTOS.slice(1));
  });

  it('renders nothing for an empty post and falls back to the photo page when the post link is unknown', async () => {
    const empty = createStrip([], '');

    expect(fixture.nativeElement.querySelector('.photo-strip'), 'no photos, no strip').toBeNull();
    expect(empty.positionLabel(), 'the closed viewer counts from zero').toBe('1 / 0');
    expect(empty.sourceUrl(), 'with neither a post nor a photo the link points nowhere').toBe('');

    fixture.destroy();

    const strip = createStrip(PHOTO_STRIP_SINGLE_PHOTO, '');
    const element: HTMLElement = fixture.nativeElement;

    await openAt(strip, 0);

    expect(element.querySelector('.photo-strip__more'), 'a single photo hides nothing').toBeNull();
    expect(element.querySelector('.photo-viewer__source')?.getAttribute('href'), 'without a post link the photo page stands in').toBe(
      PHOTO_STRIP_SINGLE_PHOTO[0].photoUrl,
    );

    element.querySelector<HTMLButtonElement>('.photo-viewer__backdrop')?.click();
    fixture.detectChanges();

    expect(strip.openPosition(), 'clicking the backdrop closes the viewer').toBeNull();
  });

  it('holds the viewer back until Swiper resolves', () => {
    const strip = createStrip();

    strip.openPosition.set(0);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('swiper-container'), 'no carousel before the chunk lands').toBeNull();
    expect(element.querySelector('.photo-viewer__loading'), 'the frame says it is opening').not.toBeNull();
  });
});

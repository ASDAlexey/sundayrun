import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IDBFactory } from 'fake-indexeddb';

import { MS_IN_SECOND } from '../../../core/time/duration.constant';
import { saveTrack } from '../../../state/athlete-track.storage';
import { settle } from '../../spec-utils/settle';
import { MyTrack } from './my-track';
import {
  BROKEN_TRACK_SLUG,
  BROKEN_TRACK_STORED,
  MY_TRACK_OFFICIAL_MS,
  MY_TRACK_SLUG,
  MY_TRACK_STORED,
  TRACKLESS_SLUG,
} from './my-track.mock';
import { REPLAY_SECONDS } from './my-track.constant';

function intersectionEntry(target: Element, isIntersecting: boolean): IntersectionObserverEntry {
  const rect = target.getBoundingClientRect();

  return {
    boundingClientRect: rect,
    intersectionRatio: isIntersecting ? 1 : 0,
    intersectionRect: rect,
    isIntersecting,
    rootBounds: null,
    target,
    time: 0,
  };
}

class MockIntersectionObserver implements IntersectionObserver {
  readonly #callback: IntersectionObserverCallback;

  static instances: MockIntersectionObserver[] = [];

  readonly root = null;
  readonly rootMargin = '';
  readonly scrollMargin = '';
  readonly thresholds: readonly number[] = [];
  readonly observe = vi.fn((target: Element) => (this.target = target));
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
  readonly takeRecords = vi.fn((): IntersectionObserverEntry[] => []);

  target: Element | undefined;

  constructor(callback: IntersectionObserverCallback) {
    this.#callback = callback;
    MockIntersectionObserver.instances.push(this);
  }

  fire(isIntersecting: boolean): void {
    const target = this.target;

    if (target) {
      this.#callback([intersectionEntry(target, isIntersecting)], this);
    }
  }
}

/** How long the drawing is given to appear before the test gives up and asserts on what it has. */
const DRAW_TIMEOUT_MS = 5000;

/** Ticks that let a load which is going to come back with nothing finish coming back with nothing. */
const EMPTY_LOAD_TICKS = 3;

/**
 * Waits for the recording to come back out of IndexedDB and be drawn.
 *
 * The chain is several turns deep — open the database, read the row, ungzip, parse, then fetch the
 * drawing module — and under a full suite those turns wait on real work, so the wait is on the
 * outcome against a clock rather than on a fixed number of ticks.
 */
async function whenDrawn(fixture: ComponentFixture<MyTrack>): Promise<void> {
  const deadline = Date.now() + DRAW_TIMEOUT_MS;

  while (fixture.componentInstance.view() === null && Date.now() < deadline) {
    await settle();
    fixture.detectChanges();
  }

  await fixture.whenStable();
}

/** The same wait for the cases that expect no card: there is no outcome to watch for. */
async function whenSettled(fixture: ComponentFixture<MyTrack>): Promise<void> {
  for (let tick = 0; tick < EMPTY_LOAD_TICKS; tick += 1) {
    await settle();
    fixture.detectChanges();
  }

  await fixture.whenStable();
}

describe('MyTrack', () => {
  let fixture: ComponentFixture<MyTrack>;

  beforeEach(() => {
    vi.stubGlobal('indexedDB', new IDBFactory());
    MockIntersectionObserver.instances = [];
  });

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
  });

  it('draws this device’s recording of the race and replays it on the run’s own clock', async () => {
    await saveTrack(MY_TRACK_STORED);

    fixture = TestBed.createComponent(MyTrack);
    fixture.componentRef.setInput('slug', MY_TRACK_SLUG);
    fixture.componentRef.setInput('officialMs', MY_TRACK_OFFICIAL_MS);
    fixture.detectChanges();
    await whenDrawn(fixture);

    const component = fixture.componentInstance;
    const host: HTMLElement = fixture.nativeElement;

    expect(component.view()?.distanceText, 'the watch’s own distance, not the declared five').toBe('5,04');
    expect(host.querySelectorAll('.my-track__trace').length, 'the route is drawn in pace bands').toBeGreaterThan(1);
    expect(host.querySelector('.my-track__meters')?.textContent, 'at rest the plate holds the whole distance').toBe('5040');
    expect(host.querySelector('.my-track__marker'), 'and nothing is running').toBeNull();

    const frames: FrameRequestCallback[] = [];

    vi.stubGlobal('requestAnimationFrame', (frame: FrameRequestCallback) => frames.push(frame));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    host.querySelector<HTMLButtonElement>('.my-track__play')?.click();
    fixture.detectChanges();
    frames.splice(0).forEach((frame) => frame(0));
    fixture.detectChanges();

    expect(component.playing()).toBe(true);
    expect(host.querySelector('.my-track__marker'), 'the marker only exists while the run does').not.toBeNull();
    expect(host.querySelector('.my-track__meters')?.textContent).toBe('0');

    frames.splice(0).forEach((frame) => frame((REPLAY_SECONDS * MS_IN_SECOND) / 2));
    fixture.detectChanges();

    const halfway = Number(host.querySelector('.my-track__meters')?.textContent);

    expect(halfway, 'half the replay is half the run — in time, not in metres').toBeGreaterThan(0);
    expect(halfway).toBeLessThan(component.view()?.distanceMeters ?? 0);
    expect(host.querySelector('.my-track__pace-now')?.textContent).toContain('/км');

    frames.splice(0).forEach((frame) => frame(REPLAY_SECONDS * MS_IN_SECOND));
    fixture.detectChanges();

    expect(component.playing(), 'the finished picture is the resting one').toBe(false);
    expect(host.querySelector('.my-track__meters')?.textContent).toBe('5040');
    expect(host.textContent, 'and the two clocks are put side by side').toContain('18:50');
  });

  it('stays away from a race this device holds nothing for, and from a slug already left behind', async () => {
    await saveTrack(MY_TRACK_STORED);

    fixture = TestBed.createComponent(MyTrack);
    fixture.componentRef.setInput('slug', TRACKLESS_SLUG);
    fixture.detectChanges();
    await whenSettled(fixture);

    const component = fixture.componentInstance;

    expect(component.view()).toBeNull();
    expect(fixture.nativeElement.querySelector('.my-track'), 'no recording, no card').toBeNull();

    component.play();

    expect(component.playing(), 'and nothing to replay either').toBe(false);

    // A navigation lands while the read for the previous race is still in flight. Both reads
    // finish, and the one the reader has already left behind must not draw over the newer race.
    fixture.componentRef.setInput('slug', MY_TRACK_SLUG);
    fixture.detectChanges();
    fixture.componentRef.setInput('slug', TRACKLESS_SLUG);
    fixture.detectChanges();
    await whenSettled(fixture);

    expect(component.view(), 'the race being looked at wins, whichever read lands last').toBeNull();

    // A file that lost its samples is not something a protocol page can explain, so it reads as
    // «no track» rather than as a broken card.
    await saveTrack(BROKEN_TRACK_STORED);
    fixture.componentRef.setInput('slug', BROKEN_TRACK_SLUG);
    fixture.detectChanges();
    await whenSettled(fixture);

    expect(component.view()).toBeNull();
  });

  it('plays itself once the card is properly on screen, and not at all under reduced motion', async () => {
    await saveTrack(MY_TRACK_STORED);
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    fixture = TestBed.createComponent(MyTrack);
    fixture.componentRef.setInput('slug', MY_TRACK_SLUG);
    fixture.detectChanges();
    await whenDrawn(fixture);

    const [observer] = MockIntersectionObserver.instances;

    observer.fire(false);

    expect(fixture.componentInstance.playing(), 'a card below the fold plays to nobody').toBe(false);

    observer.fire(true);

    expect(fixture.componentInstance.playing()).toBe(true);
    expect(observer.disconnect).toHaveBeenCalled();

    fixture.destroy();
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    MockIntersectionObserver.instances = [];

    fixture = TestBed.createComponent(MyTrack);
    fixture.componentRef.setInput('slug', MY_TRACK_SLUG);
    fixture.detectChanges();
    await whenDrawn(fixture);

    expect(MockIntersectionObserver.instances, 'nothing is even watched for').toHaveLength(0);
  });
});

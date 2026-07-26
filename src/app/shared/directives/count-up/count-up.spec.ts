import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { COUNT_UP_DURATION_MS } from './count-up.constant';
import { COUNT_UP_FORMAT, COUNT_UP_HALFWAY_VALUE, COUNT_UP_PLAIN_TARGET, COUNT_UP_SETTLED_TEXT, COUNT_UP_TARGET } from './count-up.mock';
import { CountUp } from './count-up';

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

  static watching(selector: string): MockIntersectionObserver | undefined {
    return MockIntersectionObserver.instances.find((observer) => observer.target?.matches(selector));
  }

  fire(isIntersecting: boolean): void {
    const target = this.target;

    if (target) {
      this.#callback([intersectionEntry(target, isIntersecting)], this);
    }
  }
}

let frames: FrameRequestCallback[] = [];

/**
 * Hand-cranked animation frames, so a run-up can be stepped through deterministically.
 *
 * Must be installed *after* the fixture has settled: Angular's zoneless scheduler also
 * draws from `requestAnimationFrame`, and stubbing it earlier fills the queue with its
 * callbacks instead of the directive's.
 */
function stubFrames(): void {
  frames = [];
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(performance, 'now').mockReturnValue(0);
}

function runFrame(now: number): void {
  const frame = frames.shift();

  if (frame) {
    frame(now);
  }
}

@Component({
  selector: 'app-count-up-host',
  imports: [CountUp],
  template: `
    <p class="grouped" [appCountUp]="target" [appCountUpFormat]="format">{{ settled }}</p>
    <p class="plain" [appCountUp]="plain">{{ plain }}</p>
    <p class="zero" [appCountUp]="0">—</p>
  `,
})
class CountUpHost {
  readonly target = COUNT_UP_TARGET;
  readonly plain = COUNT_UP_PLAIN_TARGET;
  readonly settled = COUNT_UP_SETTLED_TEXT;
  readonly format = COUNT_UP_FORMAT;
}

describe('CountUp', () => {
  let fixture: ComponentFixture<CountUpHost>;

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    MockIntersectionObserver.instances = [];
    frames = [];
  });

  it('runs a total up on first sight and restores the bound text', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    fixture = TestBed.createComponent(CountUpHost);
    fixture.detectChanges();
    TestBed.tick();

    const grouped: HTMLElement = fixture.nativeElement.querySelector('.grouped');
    const observer = MockIntersectionObserver.watching('.grouped');

    expect(MockIntersectionObserver.watching('.zero'), 'a zero total has nothing to run up to').toBeUndefined();

    observer?.fire(false);
    expect(grouped.textContent, 'off screen the number just sits there').toBe(COUNT_UP_SETTLED_TEXT);

    stubFrames();
    observer?.fire(true);
    expect(observer?.disconnect, 'one run-up per page view').toHaveBeenCalled();

    runFrame(0);
    expect(grouped.textContent, 'the tally starts from zero').toBe(COUNT_UP_FORMAT(0));

    runFrame(COUNT_UP_DURATION_MS / 2);
    expect(grouped.textContent, 'mid-flight values go through the passed formatter').toBe(COUNT_UP_FORMAT(COUNT_UP_HALFWAY_VALUE));

    runFrame(COUNT_UP_DURATION_MS);
    expect(grouped.textContent, 'the last frame restores the binding verbatim').toBe(COUNT_UP_SETTLED_TEXT);
  });

  it('falls back to plain digits without a formatter', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.stubGlobal('matchMedia', () => ({ matches: false }));

    fixture = TestBed.createComponent(CountUpHost);
    fixture.detectChanges();
    TestBed.tick();

    const plain: HTMLElement = fixture.nativeElement.querySelector('.plain');

    stubFrames();
    MockIntersectionObserver.watching('.plain')?.fire(true);
    runFrame(0);

    expect(plain.textContent).toBe('0');
  });

  it('leaves the number alone without IntersectionObserver', () => {
    fixture = TestBed.createComponent(CountUpHost);
    fixture.detectChanges();
    TestBed.tick();

    const grouped: HTMLElement = fixture.nativeElement.querySelector('.grouped');

    expect(grouped.textContent, 'the bound total is already correct').toBe(COUNT_UP_SETTLED_TEXT);
  });

  it('never starts when the visitor asked for reduced motion', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    vi.stubGlobal('matchMedia', () => ({ matches: true }));

    fixture = TestBed.createComponent(CountUpHost);
    fixture.detectChanges();
    TestBed.tick();

    expect(MockIntersectionObserver.instances, 'nothing is even observed').toHaveLength(0);
  });
});

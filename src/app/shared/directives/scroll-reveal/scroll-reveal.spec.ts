import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScrollReveal } from './scroll-reveal';

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

  /** The observer watching `selector`, so a fixture with several revealed hosts stays unambiguous. */
  static watching(selector: string): MockIntersectionObserver | undefined {
    return MockIntersectionObserver.instances.find((observer) => observer.target?.matches(selector));
  }

  fire(isIntersecting: boolean): void {
    if (!this.target) {
      return;
    }

    this.#callback([intersectionEntry(this.target, isIntersecting)], this);
  }
}

@Component({
  selector: 'app-reveal-host',
  imports: [ScrollReveal],
  template: '<div class="target" appScrollReveal></div><div class="target-once" appScrollReveal revealOnce></div>',
})
class RevealHost {}

describe('ScrollReveal', () => {
  let fixture: ComponentFixture<RevealHost>;

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
    MockIntersectionObserver.instances = [];
  });

  it('adds the hidden class and toggles visibility as it enters and leaves view', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    fixture = TestBed.createComponent(RevealHost);
    fixture.detectChanges();
    TestBed.tick();

    const target: HTMLElement = fixture.nativeElement.querySelector('.target');
    const observer = MockIntersectionObserver.watching('.target');

    expect(observer).toBeDefined();
    expect(target.classList.contains('reveal')).toBe(true);
    expect(observer?.observe).toHaveBeenCalledWith(target);

    observer?.fire(true);
    expect(target.classList.contains('is-visible')).toBe(true);

    observer?.fire(false);
    expect(target.classList.contains('is-visible')).toBe(false);
  });

  it('keeps a `revealOnce` element visible and stops observing after the entrance', () => {
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    fixture = TestBed.createComponent(RevealHost);
    fixture.detectChanges();
    TestBed.tick();

    const target: HTMLElement = fixture.nativeElement.querySelector('.target-once');
    const observer = MockIntersectionObserver.watching('.target-once');

    observer?.fire(true);
    expect(target.classList.contains('is-visible')).toBe(true);
    expect(observer?.disconnect, 'nothing left to watch once the block has arrived').toHaveBeenCalled();
  });

  it('reveals the element immediately when IntersectionObserver is unavailable', () => {
    fixture = TestBed.createComponent(RevealHost);
    fixture.detectChanges();
    TestBed.tick();

    const target: HTMLElement = fixture.nativeElement.querySelector('.target');

    expect(MockIntersectionObserver.instances, 'no observer is constructed without the API').toHaveLength(0);
    expect(target.classList.contains('is-visible'), 'the fallback shows the element right away').toBe(true);
  });
});

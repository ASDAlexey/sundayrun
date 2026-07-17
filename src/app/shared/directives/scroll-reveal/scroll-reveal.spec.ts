import { ChangeDetectionStrategy, Component } from '@angular/core';
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

  static last: MockIntersectionObserver | undefined;

  readonly root = null;
  readonly rootMargin = '';
  readonly scrollMargin = '';
  readonly thresholds: readonly number[] = [];
  readonly observe = vi.fn((target: Element) => (this.#target = target));
  readonly unobserve = vi.fn();
  readonly disconnect = vi.fn();
  readonly takeRecords = vi.fn((): IntersectionObserverEntry[] => []);

  #target: Element | undefined;

  constructor(callback: IntersectionObserverCallback) {
    this.#callback = callback;
    MockIntersectionObserver.last = this;
  }

  fire(isIntersecting: boolean): void {
    if (!this.#target) {
      return;
    }

    this.#callback([intersectionEntry(this.#target, isIntersecting)], this);
  }
}

@Component({
  selector: 'app-reveal-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollReveal],
  template: '<div class="target" appScrollReveal></div>',
})
class RevealHost {}

describe('ScrollReveal', () => {
  let fixture: ComponentFixture<RevealHost>;

  beforeEach(() => vi.stubGlobal('IntersectionObserver', MockIntersectionObserver));

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
    MockIntersectionObserver.last = undefined;
  });

  it('adds the hidden class and toggles visibility as it enters and leaves view', () => {
    fixture = TestBed.createComponent(RevealHost);
    fixture.detectChanges();
    TestBed.tick();

    const target: HTMLElement = fixture.nativeElement.querySelector('.target');
    const observer = MockIntersectionObserver.last;

    expect(observer).toBeDefined();
    expect(target.classList.contains('reveal')).toBe(true);
    expect(observer?.observe).toHaveBeenCalledWith(target);

    observer?.fire(true);
    expect(target.classList.contains('is-visible')).toBe(true);

    observer?.fire(false);
    expect(target.classList.contains('is-visible')).toBe(false);
  });
});

import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

import { COUNT_UP_DURATION_MS, COUNT_UP_OBSERVER_OPTIONS, REDUCED_MOTION_QUERY } from './count-up.constant';
import { CountUpFormat } from './count-up.type';

/**
 * Runs a number up from zero the first time it scrolls into view, then hands the element
 * back untouched.
 *
 * The host keeps its own binding — `{{ stats.finishes }}` still renders the real total —
 * and the directive only borrows the text for the length of the animation, restoring the
 * exact string it found. That ordering is what makes the effect safe on a prerendered
 * page: the static HTML, the hydrated DOM and the no-JS fallback all carry the final
 * number, and the run-up is a browser-only flourish layered on top.
 */
@Directive({
  selector: '[appCountUp]',
  host: { class: 'count-up' },
})
export class CountUp {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #destroyRef = inject(DestroyRef);

  /** The final tally. The bound text stays the source of truth for what is displayed. */
  readonly value = input.required<number>({ alias: 'appCountUp' });

  /** How an intermediate tally is written — pass `Intl.NumberFormat#format` for grouped totals. */
  readonly format = input<CountUpFormat>(String, { alias: 'appCountUpFormat' });

  #frame = 0;

  constructor() {
    afterNextRender(() => this.#arm());
  }

  #arm(): void {
    const target = this.value();

    // Nothing to run up to, no observer to hang the start on, or the visitor asked for
    // stillness. In each case the bound text is already correct, so leave the DOM alone.
    if (target <= 0 || typeof IntersectionObserver === 'undefined' || prefersReducedMotion()) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) {
        return;
      }

      // One run per page view: a total that re-counts every time it scrolls past reads
      // as a glitch rather than as an arrival.
      observer.disconnect();
      this.#run(target);
    }, COUNT_UP_OBSERVER_OPTIONS);

    observer.observe(this.#host.nativeElement);

    // Registered here rather than in the constructor: teardown runs on the server too, and
    // `cancelAnimationFrame` does not exist there — prerendering died on it.
    this.#destroyRef.onDestroy(() => {
      observer.disconnect();
      cancelAnimationFrame(this.#frame);
    });
  }

  #run(target: number): void {
    const el = this.#host.nativeElement;
    const settled = el.textContent;
    const format = this.format();
    const startedAt = performance.now();

    const step = (now: number): void => {
      const progress = Math.min(1, (now - startedAt) / COUNT_UP_DURATION_MS);

      if (progress === 1) {
        el.textContent = settled;

        return;
      }

      el.textContent = format(Math.round(target * easeOut(progress)));
      this.#frame = requestAnimationFrame(step);
    };

    this.#frame = requestAnimationFrame(step);
  }
}

/** Guarded because `matchMedia` is missing in jsdom and in any non-browser DOM shim. */
function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Cubic ease-out: the tally sprints away from zero and coasts into its final value. */
function easeOut(progress: number): number {
  return 1 - (1 - progress) ** 3;
}

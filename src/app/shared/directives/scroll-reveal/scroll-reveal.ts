import { Directive, ElementRef, afterNextRender, booleanAttribute, inject, input } from '@angular/core';

import { REVEAL_OBSERVER_OPTIONS } from './scroll-reveal.constant';

/**
 * Reveals an element as it scrolls into view and hides it again as it leaves,
 * so the entrance replays smoothly whichever way you scroll.
 *
 * The hidden state and the transition live in the global `.reveal` class (added
 * on the host); this directive only toggles `.is-visible` via IntersectionObserver,
 * letting the CSS transition interpolate both ways. Set up in `afterNextRender`,
 * so nothing runs during SSR.
 */
@Directive({
  selector: '[appScrollReveal]',
  host: { class: 'reveal' },
})
export class ScrollReveal {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  /**
   * Reveal once and stay revealed. Reversing is right for a decorative accent, but wrong
   * for content: an inertial flick back up on a phone blinks whole paragraphs out and in
   * again. Content sections opt into this and the observer disconnects after the entrance.
   */
  readonly revealOnce = input(false, { transform: booleanAttribute });

  constructor() {
    afterNextRender(() => this.#observe());
  }

  #observe(): void {
    const el = this.#host.nativeElement;

    // No IntersectionObserver (an old browser, jsdom in tests) — show the element right away.
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');

      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) {
        el.classList.remove('is-visible');

        return;
      }

      el.classList.add('is-visible');

      if (this.revealOnce()) {
        observer.disconnect();
      }
    }, REVEAL_OBSERVER_OPTIONS);

    observer.observe(el);
  }
}

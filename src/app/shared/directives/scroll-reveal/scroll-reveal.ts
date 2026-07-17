import { Directive, ElementRef, afterNextRender, inject } from '@angular/core';

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

  constructor() {
    afterNextRender(() => this.#observe());
  }

  #observe(): void {
    const el = this.#host.nativeElement;

    const observer = new IntersectionObserver((entries) => {
      el.classList.toggle('is-visible', entries[0].isIntersecting);
    }, REVEAL_OBSERVER_OPTIONS);

    observer.observe(el);
  }
}

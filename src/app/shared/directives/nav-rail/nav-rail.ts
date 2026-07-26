import { Directive, ElementRef, Injector, afterNextRender, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { NAV_RAIL_ACTIVE_SELECTOR } from './nav-rail.constant';

/**
 * Keeps the current item of a sideways-scrolling rail on screen.
 *
 * On a phone the header sections do not fit one line, so the rail scrolls; opening `/timer` from a
 * link, a reload or a bookmark would otherwise show a rail with no active section anywhere in it —
 * the visitor cannot tell where they are. Wide screens show the whole rail and are left alone.
 *
 * `RouterLinkActive` marks the current link in its own `NavigationEnd` handler, which subscribes
 * after this one and therefore runs after it — hence the wait for the render that follows. That
 * also keeps the measuring out of SSR, where there is nothing to scroll.
 */
@Directive({ selector: '[appNavRail]' })
export class NavRail {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #injector = inject(Injector);
  readonly #router = inject(Router);

  constructor() {
    this.#router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => afterNextRender(() => this.#revealActive(), { injector: this.#injector }));
  }

  #revealActive(): void {
    const rail = this.#host.nativeElement;
    const active = rail.querySelector(NAV_RAIL_ACTIVE_SELECTOR);

    // Nothing to chase where the rail does not scroll, and nothing to chase off-route either.
    if (active === null || rail.scrollWidth <= rail.clientWidth) {
      return;
    }

    const railBox = rail.getBoundingClientRect();
    const activeBox = active.getBoundingClientRect();

    // Centred rather than merely visible, so the neighbouring sections show on both sides
    // and the rail reads as a rail.
    rail.scrollTo({
      left: rail.scrollLeft + activeBox.left - railBox.left - (railBox.width - activeBox.width) / 2,
      behavior: 'smooth',
    });
  }
}

import { DOCUMENT, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { CANONICAL_SITE_BASE_URL } from './canonical-link.constant';

/**
 * Keeps `<link rel="canonical">` in sync with the current route, so search engines attribute
 * every page to this origin and rank scraped mirrors below it as duplicates. Instantiated by an
 * app initializer; during prerender the tag is baked into each page's static HTML.
 */
@Injectable({ providedIn: 'root' })
export class CanonicalLinkService {
  readonly #document = inject(DOCUMENT);

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.#upsertCanonicalLink(event.urlAfterRedirects));
  }

  /** Query params and fragments never change the page content, so the canonical url drops them. */
  #upsertCanonicalLink(url: string): void {
    const [path] = url.split(/[#?]/);
    let link = this.#document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.#document.createElement('link');
      link.rel = 'canonical';
      this.#document.head.appendChild(link);
    }

    link.href = `${CANONICAL_SITE_BASE_URL}${path}`;
  }
}

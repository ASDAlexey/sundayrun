import { Service, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, MetaDefinition } from '@angular/platform-browser';
import { NavigationEnd, NavigationStart, Router, TitleStrategy } from '@angular/router';
import { filter } from 'rxjs';

import { CANONICAL_SITE_BASE_URL } from './canonical-link.constant';
import {
  DEFAULT_PAGE_DESCRIPTION,
  DEFAULT_PAGE_TITLE,
  PAGE_DESCRIPTION_META_TAGS,
  PAGE_TITLE_META_TAGS,
  PAGE_URL_META_TAG,
} from './page-meta.constant';
import { PageMetaTag } from './page-meta.interface';

/**
 * Keeps the link-preview tags — `og:url`, `og:title` and `description`/`og:description` with their
 * twitter twins — in sync with the current route. `index.html` can carry only one set of them, so
 * without this every protocol pasted into Telegram, VK or WhatsApp previewed the home page and
 * pointed crawlers at `/`. Instantiated by an app initializer next to `CanonicalLinkService`;
 * during prerender the tags are baked into each page's static HTML.
 */
@Service()
export class PageMetaService {
  readonly #meta = inject(Meta);
  readonly #router = inject(Router);
  readonly #titleStrategy = inject(TitleStrategy);

  #description = DEFAULT_PAGE_DESCRIPTION;

  constructor() {
    const events = this.#router.events;

    // The outgoing page's sentence must not outlive it, and the reset has to land before the
    // incoming page is activated: a page whose payload is already baked into TransferState applies
    // it from its constructor, which runs between NavigationStart and NavigationEnd.
    events
      .pipe(
        filter((event): event is NavigationStart => event instanceof NavigationStart),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        this.#description = DEFAULT_PAGE_DESCRIPTION;
      });

    events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.#applyPageMeta(event.urlAfterRedirects));
  }

  /**
   * The sentence a page wants in its preview — «Протокол №249 от 26 июля 2026 г. — 12 финишёров …».
   * Pages push it once their payload lands, which under prerender still happens before the HTML is
   * serialized. An empty string restores the site description, so a page that found nothing to show
   * never lends the next visitor another page's sentence.
   */
  setDescription(description: string): void {
    this.#description = description === '' ? DEFAULT_PAGE_DESCRIPTION : description;
    this.#writeDescription();
  }

  #applyPageMeta(url: string): void {
    // Query params and fragments never change the page content, so og:url drops them — the same
    // url `CanonicalLinkService` derives, and the two must not disagree about what this page is.
    const [path] = url.split(/[#?]/);
    // The router emits NavigationEnd *before* running the title strategy, so `document.title` still
    // belongs to the previous page here; the resolved title has to come from the new snapshot.
    const title = this.#titleStrategy.buildTitle(this.#router.routerState.snapshot) ?? DEFAULT_PAGE_TITLE;

    this.#updateTag(PAGE_URL_META_TAG, `${CANONICAL_SITE_BASE_URL}${path}`);

    for (const tag of PAGE_TITLE_META_TAGS) {
      this.#updateTag(tag, title);
    }

    this.#writeDescription();
  }

  #writeDescription(): void {
    for (const tag of PAGE_DESCRIPTION_META_TAGS) {
      this.#updateTag(tag, this.#description);
    }
  }

  #updateTag(tag: PageMetaTag, content: string): void {
    this.#meta.updateTag(definitionOf(tag, content));
  }
}

/** `Meta` derives its selector from the definition, so the identifying attribute has to be spelled out. */
function definitionOf(tag: PageMetaTag, content: string): MetaDefinition {
  return tag.attribute === 'name' ? { name: tag.value, content } : { property: tag.value, content };
}

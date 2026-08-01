import { TestBed } from '@angular/core/testing';
import { Meta } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';

import { CANONICAL_SITE_BASE_URL } from './canonical-link.constant';
import {
  DEFAULT_PAGE_DESCRIPTION,
  DEFAULT_PAGE_TITLE,
  PAGE_DESCRIPTION_META_TAGS,
  PAGE_TITLE_META_TAGS,
  PAGE_URL_META_TAG,
} from './page-meta.constant';
import { PageMetaService } from './page-meta.service';
import { PAGE_META_DESCRIPTION, PAGE_META_ROUTE_TITLE, pageMetaTestRoutes } from './page-meta.service.mock';

describe('PageMetaService', () => {
  const tags = [PAGE_URL_META_TAG, ...PAGE_TITLE_META_TAGS, ...PAGE_DESCRIPTION_META_TAGS];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(pageMetaTestRoutes())] });
  });

  afterEach(() => {
    const meta = TestBed.inject(Meta);

    for (const tag of tags) {
      meta.removeTag(`${tag.attribute}="${tag.value}"`);
    }
  });

  it('writes the route url and title on navigation, and lets a page replace the default sentence', async () => {
    const service = TestBed.inject(PageMetaService);
    const meta = TestBed.inject(Meta);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/races/2026-07-12?utm_source=vk#row-3');

    expect(meta.getTag('property="og:url"')?.content, 'tracking params must not leak into the shared url').toBe(
      `${CANONICAL_SITE_BASE_URL}/races/2026-07-12`,
    );
    expect(meta.getTag('property="og:title"')?.content, 'the preview headline is the resolved route title').toBe(PAGE_META_ROUTE_TITLE);
    expect(meta.getTag('name="twitter:title"')?.content, 'both preview families read the same headline').toBe(PAGE_META_ROUTE_TITLE);
    expect(meta.getTag('name="description"')?.content, 'a page that said nothing yet keeps the site sentence').toBe(
      DEFAULT_PAGE_DESCRIPTION,
    );

    service.setDescription(PAGE_META_DESCRIPTION);

    expect(meta.getTag('name="description"')?.content, 'the page sentence lands without waiting for a navigation').toBe(
      PAGE_META_DESCRIPTION,
    );
    expect(meta.getTag('property="og:description"')?.content).toBe(PAGE_META_DESCRIPTION);
    expect(meta.getTag('name="twitter:description"')?.content).toBe(PAGE_META_DESCRIPTION);

    service.setDescription('');

    expect(meta.getTag('name="description"')?.content, 'a page with nothing to describe falls back to the site sentence').toBe(
      DEFAULT_PAGE_DESCRIPTION,
    );
  });

  it('restores the default sentence and the site title when the visitor leaves the page', async () => {
    const service = TestBed.inject(PageMetaService);
    const meta = TestBed.inject(Meta);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/races/2026-07-12');
    service.setDescription(PAGE_META_DESCRIPTION);
    await router.navigateByUrl('/');

    expect(meta.getTag('property="og:url"')?.content).toBe(`${CANONICAL_SITE_BASE_URL}/`);
    expect(meta.getTag('property="og:title"')?.content, 'a titleless route falls back to the site headline').toBe(DEFAULT_PAGE_TITLE);
    expect(meta.getTag('name="description"')?.content, 'the protocol sentence must not outlive the protocol').toBe(
      DEFAULT_PAGE_DESCRIPTION,
    );
    expect(meta.getTags('property="og:url"'), 'the tags are rewritten in place, never duplicated').toHaveLength(1);
  });
});

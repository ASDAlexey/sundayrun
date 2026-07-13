import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { CANONICAL_SITE_BASE_URL } from './canonical-link.constant';
import { CanonicalLinkService } from './canonical-link.service';
import { canonicalTestRoutes } from './canonical-link.service.mock';

describe('CanonicalLinkService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(canonicalTestRoutes())] });
  });

  afterEach(() => {
    TestBed.inject(DOCUMENT).head.querySelector('link[rel="canonical"]')?.remove();
  });

  it('should create the canonical link on first navigation and update it in place, dropping query and fragment', async () => {
    TestBed.inject(CanonicalLinkService);
    const router = TestBed.inject(Router);
    const head = TestBed.inject(DOCUMENT).head;

    await router.navigateByUrl('/races/2026-07-12?utm_source=vk#row-3');

    const link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    expect(link?.getAttribute('href'), 'tracking params must not leak into the canonical url').toBe(
      `${CANONICAL_SITE_BASE_URL}/races/2026-07-12`,
    );

    await router.navigateByUrl('/');

    expect(head.querySelectorAll('link[rel="canonical"]'), 'the tag is reused, not duplicated').toHaveLength(1);
    expect(link?.getAttribute('href')).toBe(`${CANONICAL_SITE_BASE_URL}/`);
  });
});

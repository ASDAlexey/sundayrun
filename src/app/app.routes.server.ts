import { inject } from '@angular/core';
import { RenderMode, ServerRoute } from '@angular/ssr';

import { AthletesService } from './github/athletes.service';
import { YearReviewService } from './github/year-review.service';

// Public pages are prerendered into static HTML for instant LCP and zero runtime db reads. The
// parameterized protocol and year-review routes enumerate their slugs/years off the on-disk db at
// build time — `getPrerenderParams` runs in an injection context, so it reaches the Node db service
// bound in `app.config.server`. The athlete pages stay client-rendered: baking every profile would
// duplicate the archive-wide aggregates into each page, so they need a materialised summary first
// (see docs/PERF_DB_REQUESTS.md). The organiser wizard and versus duels are client-rendered too.
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'races', renderMode: RenderMode.Prerender },
  { path: 'records', renderMode: RenderMode.Prerender },
  { path: 'year', renderMode: RenderMode.Prerender },
  { path: 'vs', renderMode: RenderMode.Prerender },
  { path: 'guide', renderMode: RenderMode.Prerender },
  { path: 'admin', renderMode: RenderMode.Prerender },
  {
    path: 'races/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => (await inject(AthletesService).loadEventSlugs()).map((slug) => ({ slug })),
  },
  {
    path: 'year/:year',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => (await inject(YearReviewService).loadYears()).map((year) => ({ year })),
  },
  { path: '**', renderMode: RenderMode.Client },
];

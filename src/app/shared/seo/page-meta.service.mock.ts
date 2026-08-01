import { Routes } from '@angular/router';
import { Mock, vi } from 'vitest';

/** The title the `/races/…` branch resolves, mirroring `@@title.race` in `app.routes.ts`. */
export const PAGE_META_ROUTE_TITLE = 'Протокол пробега — Воскресный парковый пробег';

/** A page-supplied sentence, shaped like the one `RacePage` pushes. */
export const PAGE_META_DESCRIPTION = 'Протокол №12 от 28 июня 2026 г. — 2 финишёра, лучшее время 25:00,00';

/**
 * A titled branch and a titleless catch-all: `/races/…` resolves a route title, everything else
 * falls back to the site one. Componentless throughout — `navigateByUrl` only has to succeed.
 */
export function pageMetaTestRoutes(): Routes {
  return [
    { path: 'races', title: PAGE_META_ROUTE_TITLE, children: [{ path: '**', children: [] }] },
    { path: '**', children: [] },
  ];
}

/** The mocked surface the pages use: the sentence each one pushes is what their specs assert. */
export interface PageMetaServiceMock {
  setDescription: Mock<(description: string) => void>;
}

/** Drop-in `PageMetaService` for the page specs: no router subscription, no document touched. */
export function pageMetaServiceMock(): PageMetaServiceMock {
  return { setDescription: vi.fn() };
}

import { RenderMode, ServerRoute } from '@angular/ssr';

// Parameterless public pages are prerendered into static HTML for instant LCP on GitHub Pages.
// Parameterized and guarded routes render on the client: slugs are unknown at build time and
// the organiser wizard depends on localStorage.
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'races', renderMode: RenderMode.Prerender },
  { path: 'records', renderMode: RenderMode.Prerender },
  { path: 'vs', renderMode: RenderMode.Prerender },
  { path: 'guide', renderMode: RenderMode.Prerender },
  { path: 'admin', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Client },
];

import { isPlatformBrowser } from '@angular/common';
import {
  ApplicationConfig,
  ErrorHandler,
  PLATFORM_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideClientHydration, withEventReplay, withI18nSupport, withIncrementalHydration } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideServiceWorker } from '@angular/service-worker';

import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { NotifyingErrorHandler } from './core/error/notifying-error-handler';
import { RouteErrorNotifier } from './core/error/route-error-notifier';
import { CanonicalLinkService } from './shared/seo/canonical-link.service';
import { PageMetaService } from './shared/seo/page-meta.service';
import { AppUpdateService } from './state/app-update.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // Uncaught errors surface as a Material toast instead of failing silently (admin/publish flows).
    { provide: ErrorHandler, useClass: NotifyingErrorHandler },
    // Eagerly instantiated so every navigation (and each prerendered page) carries its canonical url.
    provideAppInitializer(() => {
      inject(CanonicalLinkService);
      // Same deal for the link-preview tags: og:url, og:title and the description follow the route
      // rather than sitting frozen on the home page's, and the prerender bakes them into each file.
      inject(PageMetaService);
      // The route-error watcher (stale-chunk reload + toasts) only makes sense in the browser.
      if (isPlatformBrowser(inject(PLATFORM_ID))) {
        inject(RouteErrorNotifier);
        // The same goes for the update gate: it holds a new release back until the race is over.
        inject(AppUpdateService);
      }
    }),
    // Public pages are prerendered (see app.routes.server.ts); hydration reuses that HTML.
    // `withIncrementalHydration` is Angular 22's default, but the `@defer (hydrate on viewport)`
    // blocks on /races and the home page depend on it, so it is spelled out rather than assumed.
    provideClientHydration(withEventReplay(), withI18nSupport(), withIncrementalHydration()),
    // Offline shell for the race stopwatch (docs/TIMER.md §12). `ngsw-config.json` is wired into
    // the production build only, so `ngsw-worker.js` simply does not exist in dev — hence the
    // `production` gate. Being browser-only needs no extra guard here: this config is shared with
    // `app.config.server.ts`, but Angular's own registration initializer and comm channel bail out
    // under `ngServerMode`, so nothing touches `navigator` while prerendering. Registration waits
    // for app stability (30s cap) to keep the precache off the critical path of the first paint.
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};

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
import { provideClientHydration, withEventReplay, withI18nSupport } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { NotifyingErrorHandler } from './core/error/notifying-error-handler';
import { RouteErrorNotifier } from './core/error/route-error-notifier';
import { CanonicalLinkService } from './shared/seo/canonical-link.service';

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
      // The route-error watcher (stale-chunk reload + toasts) only makes sense in the browser.
      if (isPlatformBrowser(inject(PLATFORM_ID))) {
        inject(RouteErrorNotifier);
      }
    }),
    // Public pages are prerendered (see app.routes.server.ts); hydration reuses that HTML.
    provideClientHydration(withEventReplay(), withI18nSupport()),
  ],
};

import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideClientHydration, withEventReplay, withI18nSupport } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { CanonicalLinkService } from './shared/seo/canonical-link.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    // Eagerly instantiated so every navigation (and each prerendered page) carries its canonical url.
    provideAppInitializer(() => {
      inject(CanonicalLinkService);
    }),
    // Public pages are prerendered (see app.routes.server.ts); hydration reuses that HTML.
    provideClientHydration(withEventReplay(), withI18nSupport()),
  ],
};

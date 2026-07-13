import { Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationError, Router } from '@angular/router';
import { filter } from 'rxjs';

import { NotificationService } from '../../shared/notification/notification.service';
import { isStaleChunkError, triggerStaleChunkReload } from './lazy-chunk-reload';
import { NAVIGATION_ERROR_MESSAGE, STALE_CHUNK_RELOAD_FAILED_MESSAGE } from './route-error-notifier.constant';

/**
 * Watches the router so a failed navigation never dies silently. A stale lazy chunk after a deploy
 * triggers a one-time reload to recover the current shell (see [[lazy-chunk-reload]]); any other
 * navigation error surfaces as a Material toast. Eagerly created from an app initializer, browser-only.
 */
@Injectable({ providedIn: 'root' })
export class RouteErrorNotifier {
  readonly #notification = inject(NotificationService);

  constructor() {
    inject(Router)
      .events.pipe(
        filter((event): event is NavigationError => event instanceof NavigationError),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.#handle(event));
  }

  #handle(event: NavigationError): void {
    if (isStaleChunkError(event.error)) {
      // A reload recovers a stale cache; if it already fired, the deploy itself is broken — say so.
      if (!triggerStaleChunkReload(Date.now())) {
        this.#notification.error(STALE_CHUNK_RELOAD_FAILED_MESSAGE);
      }

      return;
    }

    this.#notification.error(NAVIGATION_ERROR_MESSAGE);
  }
}

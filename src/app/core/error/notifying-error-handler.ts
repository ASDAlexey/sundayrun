import { isPlatformBrowser } from '@angular/common';
import { ErrorHandler, Injectable, Injector, PLATFORM_ID, inject } from '@angular/core';

import { NotificationService } from '../../shared/notification/notification.service';
import { UNEXPECTED_ERROR_MESSAGE } from './notifying-error-handler.constant';

/**
 * Replaces Angular's default ErrorHandler so an otherwise-silent uncaught error — a throw in an admin
 * action, a publish that blows up unexpectedly — also surfaces as a Material toast. The base handler
 * still logs to the console for debugging; the toast is browser-only, so NotificationService (and its
 * MatSnackBar) is resolved lazily, never constructed during prerender.
 */
@Injectable()
export class NotifyingErrorHandler implements ErrorHandler {
  readonly #base = new ErrorHandler();
  readonly #injector = inject(Injector);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  handleError(error: unknown): void {
    this.#base.handleError(error);

    if (this.#isBrowser) {
      this.#injector.get(NotificationService).error(UNEXPECTED_ERROR_MESSAGE);
    }
  }
}

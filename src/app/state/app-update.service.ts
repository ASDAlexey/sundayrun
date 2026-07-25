import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';

import { TimerStatus } from '../core/timer/timer-session.enum';
import { VERSION_READY_EVENT } from './app-update.constant';
import { TimerSessionService } from './timer-session.service';

/**
 * The gate a new release has to pass. A deployed build is downloaded by the service worker and then
 * waits: activating it swaps the shell and reloads the tab, and doing that mid-race would cost
 * exactly the splits nobody can take again (docs/TIMER.md §12). So the update lands the moment the
 * open measurement is not running — before the start, after the stop, or on any other page — and
 * simply keeps waiting while it is.
 *
 * Browser-only and eagerly created from an app initializer. Without a registered worker
 * (`ng serve`, prerender, an unsupported browser) `isEnabled` is false and this is a no-op.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdateService {
  readonly #swUpdate = inject(SwUpdate);
  readonly #sessions = inject(TimerSessionService);
  readonly #document = inject(DOCUMENT);
  readonly #pending = signal(false);

  constructor() {
    if (!this.#swUpdate.isEnabled) {
      return;
    }

    this.#swUpdate.versionUpdates
      .pipe(
        filter((event) => event.type === VERSION_READY_EVENT),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.#pending.set(true));

    effect(() => {
      if (this.#pending() && this.#sessions.active()?.status !== TimerStatus.running) {
        this.#pending.set(false);
        void this.#apply();
      }
    });
  }

  async #apply(): Promise<void> {
    try {
      await this.#swUpdate.activateUpdate();
      this.#document.defaultView?.location.reload();
    } catch {
      // The activation failed, so the tab stays on the version it already has — which works.
    }
  }
}

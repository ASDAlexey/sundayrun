import { DOCUMENT, DestroyRef, Service, inject, signal } from '@angular/core';

import { OFFLINE_EVENT, ONLINE_EVENT } from './offline-notice.constant';

/**
 * Whether this device is currently without a network, watched once for the whole shell.
 * `navigator.onLine` is a hint rather than a promise of reachability, and that is exactly the
 * certainty the offline notice needs: it only decides whether a failed load is explained by a park
 * with no signal or by something that deserves the page's real error text (docs/TIMER.md §12).
 * Prerender has no window, so the static HTML is always built as «online».
 */
@Service()
export class OfflineStatusService {
  readonly #view = inject(DOCUMENT).defaultView;
  readonly #offline = signal(this.#view?.navigator.onLine === false);

  readonly offline = this.#offline.asReadonly();

  constructor() {
    const view = this.#view;
    const destroyRef = inject(DestroyRef);

    if (view === null) {
      return;
    }

    const onOnline = (): void => this.#offline.set(false);
    const onOffline = (): void => this.#offline.set(true);

    view.addEventListener(ONLINE_EVENT, onOnline);
    view.addEventListener(OFFLINE_EVENT, onOffline);

    destroyRef.onDestroy(() => {
      view.removeEventListener(ONLINE_EVENT, onOnline);
      view.removeEventListener(OFFLINE_EVENT, onOffline);
    });
  }
}

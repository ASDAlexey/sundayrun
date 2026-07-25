import { DOCUMENT, Injectable, OnDestroy, inject, signal } from '@angular/core';

import { DOCUMENT_VISIBLE, VISIBILITY_CHANGE_EVENT, WAKE_LOCK_SCREEN } from './wake-lock.constant';

/**
 * Keeps the screen lit for as long as the race runs (docs/TIMER.md §11). A phone that dims itself
 * two minutes before the pack arrives costs exactly the splits nobody can take again, and the
 * organiser is holding it in one hand — waking it up is not a free gesture.
 *
 * The lock is tied to the race, not to the page: it is taken on «Старт» and given back on «Стоп»,
 * so a screen that is merely showing «Мои замеры» is allowed to go dark like any other page. The
 * system takes the lock away by itself whenever the tab goes to the background, which is why
 * `visibilitychange` re-acquires it instead of trusting the sentinel to survive.
 *
 * Where the API is missing (Safari below 16.4, an old WebView) or the request is refused, nothing
 * throws and nothing retries: `unsupported` goes up and the race screen quietly asks for a longer
 * auto-lock instead.
 */
@Injectable({ providedIn: 'root' })
export class WakeLockService implements OnDestroy {
  readonly #document = inject(DOCUMENT);
  readonly #view = inject(DOCUMENT).defaultView;
  readonly #unsupported = signal(false);

  /** The screen may go dark on its own: the platform has no lock to give, or refused to give it. */
  readonly unsupported = this.#unsupported.asReadonly();

  #sentinel: WakeLockSentinel | null = null;
  #wanted = false;
  #detach: (() => void) | null = null;

  ngOnDestroy(): void {
    this.release();
  }

  /** Asks for the lock and keeps asking for it back after every trip to the background. */
  request(): void {
    if (this.#wanted) {
      return;
    }

    this.#wanted = true;

    const onVisibility = (): void => {
      if (this.#document.visibilityState === DOCUMENT_VISIBLE) {
        void this.#acquire();
      }
    };

    this.#document.addEventListener(VISIBILITY_CHANGE_EVENT, onVisibility);
    this.#detach = () => this.#document.removeEventListener(VISIBILITY_CHANGE_EVENT, onVisibility);
    void this.#acquire();
  }

  /** Gives the screen back to the phone; releasing what was never taken is a no-op. */
  release(): void {
    this.#wanted = false;
    this.#detach?.();
    this.#detach = null;

    const sentinel = this.#sentinel;

    this.#sentinel = null;
    void sentinel?.release().catch(() => undefined);
  }

  async #acquire(): Promise<void> {
    const manager = this.#view?.navigator.wakeLock;

    if (manager === undefined) {
      this.#unsupported.set(true);

      return;
    }

    try {
      const sentinel = await manager.request(WAKE_LOCK_SCREEN);

      // «Стоп» may have landed while the request was still in flight; the lock then goes straight
      // back, or the screen would stay lit for the rest of the morning.
      if (this.#wanted) {
        this.#sentinel = sentinel;

        return;
      }

      await sentinel.release();
    } catch {
      this.#unsupported.set(true);
    }
  }
}

import { DOCUMENT, DestroyRef, Service, computed, inject, signal } from '@angular/core';

import { APP_INSTALLED_EVENT, INSTALL_PROMPT_EVENT, INSTALL_SETTLE_MS, STANDALONE_MEDIA_QUERY } from './install-app.constant';
import { InstallOffer, InstallOfferType } from './install-app.enum';
import { InstallPromptEvent } from './install-app.interface';
import { isInstallPromptEvent } from './install-app.view';

/**
 * Whether the app can still be put on the home screen, and how it would get there.
 *
 * Chromium decides on its own when a site is installable and fires `beforeinstallprompt` once —
 * seconds after the service worker registers, long before the organiser walks over to /admin. Miss
 * that event and there is no asking for it again, so the listener is installed at app start (see
 * `app.config.ts`) and the event is parked here until the panel's button spends it. Every browser on
 * iOS, and desktop Safari and Firefox, fire nothing at all: after a short wait the offer turns into
 * the instruction for adding the app by hand. Which of the two it is follows what the browser did,
 * never a user-agent string.
 */
@Service()
export class InstallPromptService {
  readonly #view = inject(DOCUMENT).defaultView;
  readonly #prompt = signal<InstallPromptEvent | null>(null);
  readonly #installed = signal(false);
  readonly #settled = signal(false);

  /** What the install block should show right now; `none` keeps it off the page entirely. */
  readonly offer = computed<InstallOfferType>(() => {
    // Optional call, not carelessness: a browser (or a test environment) without `matchMedia` simply
    // cannot be an installed app, and must not take the whole block down over it.
    if (this.#installed() || this.#view?.matchMedia?.(STANDALONE_MEDIA_QUERY).matches === true) {
      return InstallOffer.none;
    }

    if (this.#prompt() !== null) {
      return InstallOffer.prompt;
    }

    return this.#settled() ? InstallOffer.manual : InstallOffer.none;
  });

  constructor() {
    const view = this.#view;
    const destroyRef = inject(DestroyRef);

    if (view === null) {
      return;
    }

    const onPrompt = (event: Event): void => {
      // Without this Chromium shows its own mini-infobar over the page; the offer is ours to place.
      event.preventDefault();

      if (isInstallPromptEvent(event)) {
        this.#prompt.set(event);
      }
    };

    const onInstalled = (): void => {
      this.#installed.set(true);
      this.#prompt.set(null);
    };

    view.addEventListener(INSTALL_PROMPT_EVENT, onPrompt);
    view.addEventListener(APP_INSTALLED_EVENT, onInstalled);

    const settleId = view.setTimeout(() => this.#settled.set(true), INSTALL_SETTLE_MS);

    destroyRef.onDestroy(() => {
      view.removeEventListener(INSTALL_PROMPT_EVENT, onPrompt);
      view.removeEventListener(APP_INSTALLED_EVENT, onInstalled);
      view.clearTimeout(settleId);
    });
  }

  /**
   * Opens the browser's install dialog. The event is spent by the call — Chromium refuses a second
   * one — so a dismissed dialog leaves the manual instruction in its place until the browser offers
   * again.
   */
  async install(): Promise<void> {
    const event = this.#prompt();

    if (event === null) {
      return;
    }

    this.#prompt.set(null);
    this.#settled.set(true);
    await event.prompt();
  }
}

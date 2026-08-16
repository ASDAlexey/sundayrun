import { DOCUMENT, Service, inject, signal } from '@angular/core';

import {
  HUNDREDTHS_HIDDEN_CLASS,
  HUNDREDTHS_HIDDEN_VALUE,
  HUNDREDTHS_SSR_NOOP_STORAGE,
  HUNDREDTHS_STORAGE_KEY,
} from './hundredths.constant';
import { HundredthsStorage } from './hundredths.type';

/**
 * Remembers whether this device draws results to hundredths («Настройки» in the header).
 *
 * Every result on the site is measured and stored to hundredths, and the timed rows genuinely need
 * them — but most of the archive was written down to whole seconds and can only ever read ',00'.
 * For a reader who never races a photo finish that trailing pair is graphic noise, so the fraction
 * is made optional here rather than dropped for everyone.
 *
 * The pick is pure device-local personalisation, like «Выбери себя» ([[SelfAthleteService]]): it
 * never travels with a link, never reaches the published PDFs, and never touches the stored data.
 * Switching it flips a class on `<html>` — the fraction stays in the DOM, so hydration still meets
 * the structure the prerender wrote — and the signal is here for the surfaces CSS cannot reach:
 * the switch itself, chart tooltips drawn on canvas, SVG labels.
 */
@Service()
export class HundredthsService {
  readonly #document = inject(DOCUMENT);
  readonly #shown = signal(this.#storage.getItem(HUNDREDTHS_STORAGE_KEY) !== HUNDREDTHS_HIDDEN_VALUE);

  /** `true` — 'm:ss,cc' everywhere, the default; `false` — the site reads to whole seconds. */
  readonly shown = this.#shown.asReadonly();

  toggle(): void {
    const shown = !this.#shown();

    if (shown) {
      this.#storage.removeItem(HUNDREDTHS_STORAGE_KEY);
    } else {
      this.#storage.setItem(HUNDREDTHS_STORAGE_KEY, HUNDREDTHS_HIDDEN_VALUE);
    }

    this.#shown.set(shown);
    this.#document.documentElement.classList.toggle(HUNDREDTHS_HIDDEN_CLASS, !shown);
  }

  /** Live localStorage access, so specs can stub the global per scenario; absent during prerender. */
  get #storage(): HundredthsStorage {
    return typeof localStorage === 'undefined' ? HUNDREDTHS_SSR_NOOP_STORAGE : localStorage;
  }
}

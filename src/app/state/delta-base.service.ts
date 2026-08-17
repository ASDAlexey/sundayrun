import { DOCUMENT, Service, inject, signal } from '@angular/core';

import { DELTA_BASE_CLASSES, DELTA_BASE_DEFAULT, DELTA_BASE_SSR_NOOP_STORAGE, DELTA_BASE_STORAGE_KEY } from './delta-base.constant';
import { DeltaBase, DeltaBaseType } from './delta-base.enum';
import { DeltaBaseStorage } from './delta-base.type';

/**
 * Remembers what the protocol's delta column measures against on this device («Настройки» in the
 * header).
 *
 * The column used to have one answer — the personal record — and one answer was the problem: a
 * record is by definition the best day of a career, so measuring every race against it prints a
 * shortfall beside nearly every name and calls it information. The runner's own recent form lands
 * either side of the line honestly, and is the default here; the season and the record stay
 * available for the readers who came for exactly those, and the whole column can be switched off.
 *
 * The pick is pure device-local personalisation, like «Выбери себя» ([[SelfAthleteService]]) and
 * the hundredths ([[HundredthsService]]): it never travels with a link, never reaches the published
 * PDFs and never touches the stored data. Switching it flips a class on `<html>` — every base is
 * drawn into the markup and CSS shows one, so hydration still meets the prerendered structure — and
 * the signal is here for the surfaces CSS cannot reach: the switch itself, and the column's own
 * heading, which has to name the base it is showing.
 */
@Service()
export class DeltaBaseService {
  readonly #document = inject(DOCUMENT);
  readonly #base = signal(readStored(this.#storage.getItem(DELTA_BASE_STORAGE_KEY)));

  /** `form` — the rolling median, the default; see `DeltaBase` for the rest. */
  readonly base = this.#base.asReadonly();

  select(base: DeltaBaseType): void {
    if (base === DELTA_BASE_DEFAULT) {
      this.#storage.removeItem(DELTA_BASE_STORAGE_KEY);
    } else {
      this.#storage.setItem(DELTA_BASE_STORAGE_KEY, base);
    }

    this.#base.set(base);

    for (const [candidate, className] of Object.entries(DELTA_BASE_CLASSES)) {
      if (className !== '') {
        this.#document.documentElement.classList.toggle(className, candidate === base);
      }
    }
  }

  /** Live localStorage access, so specs can stub the global per scenario; absent during prerender. */
  get #storage(): DeltaBaseStorage {
    return typeof localStorage === 'undefined' ? DELTA_BASE_SSR_NOOP_STORAGE : localStorage;
  }
}

/** A hand-edited or outdated stored value degrades to the default instead of blanking the column. */
function readStored(raw: string | null): DeltaBaseType {
  const known = Object.values(DeltaBase).find((base) => base === raw);

  return known ?? DELTA_BASE_DEFAULT;
}

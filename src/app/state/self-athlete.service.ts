import { Injectable, signal } from '@angular/core';

import { SELF_ATHLETE_STORAGE_KEY, SELF_SSR_NOOP_STORAGE } from './self-athlete.constant';
import { SelfAthlete } from './self-athlete.interface';
import { SelfAthleteStorage } from './self-athlete.type';

/**
 * Remembers which athlete the visitor is («Выбери себя» in the header) in localStorage.
 * The pick is pure device-local personalisation — highlighted protocol rows, a prefilled duel
 * slot, the personal card on the home page — never an identity claim the site verifies.
 */
@Injectable({ providedIn: 'root' })
export class SelfAthleteService {
  readonly #self = signal<SelfAthlete | null>(readStored(this.#storage.getItem(SELF_ATHLETE_STORAGE_KEY)));

  readonly self = this.#self.asReadonly();

  save(athlete: SelfAthlete): void {
    this.#storage.setItem(SELF_ATHLETE_STORAGE_KEY, JSON.stringify(athlete));
    this.#self.set(athlete);
  }

  clear(): void {
    this.#storage.removeItem(SELF_ATHLETE_STORAGE_KEY);
    this.#self.set(null);
  }

  /** Live localStorage access, so specs can stub the global per scenario; absent during prerender. */
  get #storage(): SelfAthleteStorage {
    return typeof localStorage === 'undefined' ? SELF_SSR_NOOP_STORAGE : localStorage;
  }
}

/** A malformed or hand-edited stored value degrades to «no pick» instead of breaking the shell. */
function readStored(raw: string | null): SelfAthlete | null {
  if (raw === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (isSelfAthlete(parsed)) {
      return parsed;
    }
  } catch {
    // Fall through to the null below: broken JSON and a wrong shape degrade the same way.
  }

  return null;
}

function isSelfAthlete(value: unknown): value is SelfAthlete {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const key = 'key' in value ? value.key : undefined;
  const displayName = 'displayName' in value ? value.displayName : undefined;

  return typeof key === 'string' && key !== '' && typeof displayName === 'string';
}

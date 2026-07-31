import { computed, inject, Service, signal } from '@angular/core';

import { CorosClient } from '../core/coros/coros.client';
import { CorosRegionType } from '../core/coros/coros-region.enum';
import { SelfAthleteStorage } from './self-athlete.type';
import { clearTracks } from './athlete-track.storage';
import { TrackSource } from './track-source.enum';
import { WATCH_ACCOUNT_STORAGE_KEY, WATCH_SSR_NOOP_STORAGE } from './watch-account.constant';
import { WatchAccount } from './watch-account.interface';

/**
 * The watch account this device is linked to («Привязать часы» on your own profile).
 *
 * Device-local, like the athlete pick: nothing is uploaded and nothing reaches the repository.
 * The password is hashed for the one login request and dropped; only the session token is stored,
 * which is what makes «linked once, syncs by itself» possible at all.
 */
@Service()
export class WatchAccountService {
  readonly #coros = inject(CorosClient);
  readonly #account = signal<WatchAccount | null>(readStored(this.#storage.getItem(WATCH_ACCOUNT_STORAGE_KEY)));

  readonly account = this.#account.asReadonly();

  readonly linked = computed(() => this.#account() !== null);

  /** Exchanges the password for a token; the password itself is gone by the time this resolves. */
  async link(email: string, password: string, region: CorosRegionType): Promise<void> {
    const token = await this.#coros.login(email, password, region);

    this.#save({ source: TrackSource.Coros, email, region, token });
  }

  /** A token Coros no longer honours: the link is dropped, the downloaded tracks stay. */
  expire(): void {
    this.#storage.removeItem(WATCH_ACCOUNT_STORAGE_KEY);
    this.#account.set(null);
  }

  /** «Отвязать и удалить» — the link and every track this device holds go together. */
  async unlink(): Promise<void> {
    this.expire();
    await clearTracks();
  }

  #save(account: WatchAccount): void {
    this.#storage.setItem(WATCH_ACCOUNT_STORAGE_KEY, JSON.stringify(account));
    this.#account.set(account);
  }

  /** Live localStorage access, so specs can stub the global per scenario; absent during prerender. */
  get #storage(): SelfAthleteStorage {
    return typeof localStorage === 'undefined' ? WATCH_SSR_NOOP_STORAGE : localStorage;
  }
}

/** A malformed or hand-edited value degrades to «not linked» instead of breaking the profile. */
function readStored(raw: string | null): WatchAccount | null {
  if (raw === null) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (isWatchAccount(parsed)) {
      return parsed;
    }
  } catch {
    // Fall through to the null below: broken JSON and a wrong shape degrade the same way.
  }

  return null;
}

function isWatchAccount(value: unknown): value is WatchAccount {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const token = 'token' in value ? value.token : undefined;
  const email = 'email' in value ? value.email : undefined;
  const region = 'region' in value ? value.region : undefined;

  return typeof token === 'string' && token !== '' && typeof email === 'string' && typeof region === 'string';
}

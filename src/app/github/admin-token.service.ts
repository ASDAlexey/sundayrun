import { Injectable, computed, signal } from '@angular/core';

import { checkGithubToken } from '../core/github/token-check';
import { TokenCheckType } from '../core/github/token-check.enum';
import { ADMIN_TOKEN_STORAGE_KEY } from './admin-token.constant';

/** Keeps the organiser's GitHub PAT in localStorage; a stored token IS the admin role. */
@Injectable({ providedIn: 'root' })
export class AdminTokenService {
  readonly #token = signal<string | null>(this.#storage.getItem(ADMIN_TOKEN_STORAGE_KEY));

  readonly token = this.#token.asReadonly();
  readonly isAdmin = computed(() => this.token() !== null);

  save(token: string): void {
    this.#storage.setItem(ADMIN_TOKEN_STORAGE_KEY, token);
    this.#token.set(token);
  }

  clear(): void {
    this.#storage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    this.#token.set(null);
  }

  /** Probes the protocols repository with the candidate token; never throws. */
  validate(token: string): Promise<TokenCheckType> {
    return checkGithubToken(token);
  }

  /** Live localStorage access, so specs can stub the global per scenario. */
  get #storage(): Storage {
    return localStorage;
  }
}

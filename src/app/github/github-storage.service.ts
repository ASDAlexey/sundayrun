import { Injectable, inject, signal } from '@angular/core';

import { GithubAuthError } from '../core/github/github-errors';
import { publishEvent } from '../core/github/publish-event';
import { PublishEventInput } from '../core/github/publish-event.interface';
import { AdminTokenService } from './admin-token.service';
import { PublishState, PublishStateType } from './github-storage.enum';

/** Publishes one event into the protocols repository, exposing the flow state and the sha-pinned pdf url. */
@Injectable({ providedIn: 'root' })
export class GithubStorageService {
  readonly #adminToken = inject(AdminTokenService);
  readonly #state = signal<PublishStateType>(PublishState.idle);
  readonly #publishedPdfUrl = signal<string | null>(null);

  readonly state = this.#state.asReadonly();
  readonly publishedPdfUrl = this.#publishedPdfUrl.asReadonly();

  /** Root singleton keeps state across routes; each new event must start from a clean slate. */
  reset(): void {
    this.#state.set(PublishState.idle);
    this.#publishedPdfUrl.set(null);
  }

  async publish(input: PublishEventInput): Promise<void> {
    if (this.#state() === PublishState.publishing) {
      return;
    }

    const token = this.#adminToken.token();

    if (token === null) {
      this.#state.set(PublishState.authError);

      return;
    }

    this.#state.set(PublishState.publishing);

    try {
      const result = await publishEvent(token, input);

      this.#publishedPdfUrl.set(result.pdfUrl);
      this.#state.set(PublishState.success);
    } catch (error) {
      this.#state.set(error instanceof GithubAuthError ? PublishState.authError : PublishState.error);
    }
  }
}

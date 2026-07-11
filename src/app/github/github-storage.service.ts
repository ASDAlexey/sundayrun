import { Injectable, inject, signal } from '@angular/core';

import { GithubAuthError } from '../core/github/github-errors';
import { publishEvent } from '../core/github/publish-event';
import { PublishEventInput } from '../core/github/publish-event.interface';
import { AdminTokenService } from './admin-token.service';
import { CdnRefService } from './cdn-ref.service';
import { PublishState, PublishStateType } from './github-storage.enum';

/** Publishes one event into the protocols repository, exposing the flow state. */
@Injectable({ providedIn: 'root' })
export class GithubStorageService {
  readonly #adminToken = inject(AdminTokenService);
  readonly #cdnRef = inject(CdnRefService);
  readonly #state = signal<PublishStateType>(PublishState.idle);

  readonly state = this.#state.asReadonly();

  /** Root singleton keeps state across routes; each new event must start from a clean slate. */
  reset(): void {
    this.#state.set(PublishState.idle);
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

      this.#cdnRef.pin(result.commitSha);
      this.#state.set(PublishState.success);
    } catch (error) {
      this.#state.set(error instanceof GithubAuthError ? PublishState.authError : PublishState.error);
    }
  }
}

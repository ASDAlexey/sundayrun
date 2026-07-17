import { Injectable, inject, signal } from '@angular/core';

import { deleteEvent } from '../core/github/delete-event';
import { GithubAuthError } from '../core/github/github-errors';
import { AdminTokenService } from './admin-token.service';
import { CdnRefService } from './cdn-ref.service';
import { PublishState, PublishStateType } from './github-storage.enum';

/** Deletes one published event from the protocols repository, exposing the flow state. */
@Injectable({ providedIn: 'root' })
export class EventDeleteService {
  readonly #adminToken = inject(AdminTokenService);
  readonly #cdnRef = inject(CdnRefService);
  readonly #state = signal<PublishStateType>(PublishState.idle);

  readonly state = this.#state.asReadonly();

  async delete(slug: string): Promise<void> {
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
      const { commitSha, pointerPublished } = await deleteEvent(token, slug);

      // Pin either way: the deletion db is live for this session; a lagging pointer only delays others.
      this.#cdnRef.pin(commitSha);
      this.#state.set(pointerPublished ? PublishState.success : PublishState.pending);
    } catch (error) {
      this.#state.set(error instanceof GithubAuthError ? PublishState.authError : PublishState.error);
    }
  }
}

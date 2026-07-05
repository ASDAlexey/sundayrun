import { Injectable, inject, signal } from '@angular/core';

import { GithubAuthError } from '../core/github/github-errors';
import { HTTP_FORBIDDEN, HTTP_NOT_FOUND } from '../core/github/github-api.constant';
import { jsDelivrFileUrl } from '../core/github/jsdelivr';
import { SITE_META_JSON_PATH } from '../core/github/protocols-repo.constant';
import { publishSiteMeta } from '../core/github/publish-site-meta';
import { parseSiteMeta } from '../core/github/site-meta';
import { SiteMetaFile } from '../core/github/site-meta.interface';
import { AdminTokenService } from './admin-token.service';
import { PublishState, PublishStateType } from './github-storage.enum';
import { SITE_META_LOAD_ERROR_PREFIX } from './site-meta.service.constant';

/**
 * Reads the public site meta (start time + announcement) from the jsDelivr CDN and lets the
 * organiser publish a new version. A 404/403 means the file has never been published and
 * yields the empty meta; any other non-OK response or a network failure rejects.
 */
@Injectable({ providedIn: 'root' })
export class SiteMetaService {
  readonly #adminToken = inject(AdminTokenService);
  readonly #state = signal<PublishStateType>(PublishState.idle);

  readonly state = this.#state.asReadonly();

  async load(): Promise<SiteMetaFile> {
    const response = await fetch(jsDelivrFileUrl(SITE_META_JSON_PATH));

    if (response.status === HTTP_NOT_FOUND || response.status === HTTP_FORBIDDEN) {
      return parseSiteMeta(null);
    }

    if (!response.ok) {
      throw new Error(`${SITE_META_LOAD_ERROR_PREFIX}${response.status}`);
    }

    return parseSiteMeta(await response.text());
  }

  async save(meta: SiteMetaFile): Promise<void> {
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
      await publishSiteMeta(token, meta);
      this.#state.set(PublishState.success);
    } catch (error) {
      this.#state.set(error instanceof GithubAuthError ? PublishState.authError : PublishState.error);
    }
  }
}

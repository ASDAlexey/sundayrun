import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { buildSiteMeta } from '../../core/github/site-meta';
import { EMPTY_SITE_META } from '../../core/github/site-meta.constant';
import { SiteMetaFile } from '../../core/github/site-meta.interface';
import { TokenCheck } from '../../core/github/token-check.enum';
import { AdminTokenService } from '../../github/admin-token.service';
import { PublishState } from '../../github/github-storage.enum';
import { SiteMetaService } from '../../github/site-meta.service';
import { EMPTY_TOKEN, TOKEN_HELP_URL } from './admin-page.constant';
import { TokenSaveStatus, TokenSaveStatusType } from './admin-page.enum';
import { HOME_ROUTE_COMMANDS } from './admin.guard.constant';

/**
 * The /admin page: the organiser pastes a fine-grained GitHub PAT; a valid one unlocks the
 * publish wizard and the home-page announcement editor (start time + message).
 */
@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPage {
  readonly #adminToken = inject(AdminTokenService);
  readonly #siteMeta = inject(SiteMetaService);
  readonly #router = inject(Router);

  readonly status = signal<TokenSaveStatusType>(TokenSaveStatus.idle);
  readonly isAdmin = this.#adminToken.isAdmin;
  /** null until the published meta arrives; the save button stays disabled to avoid blind overwrites. */
  readonly meta = signal<SiteMetaFile | null>(null);
  readonly metaState = this.#siteMeta.state;

  protected readonly statuses = TokenSaveStatus;
  protected readonly publishStates = PublishState;
  protected readonly tokenHelpUrl = TOKEN_HELP_URL;

  constructor() {
    // Prerender ships the page without data; the editor prefill arrives after hydration.
    if (isPlatformBrowser(inject(PLATFORM_ID)) && this.isAdmin()) {
      void this.#loadMeta();
    }
  }

  async save(rawToken: string): Promise<void> {
    const token = rawToken.trim();

    if (token === EMPTY_TOKEN) {
      this.status.set(TokenSaveStatus.empty);

      return;
    }

    this.status.set(TokenSaveStatus.checking);

    const check = await this.#adminToken.validate(token);

    if (check === TokenCheck.valid) {
      this.status.set(TokenSaveStatus.valid);
      this.#adminToken.save(token);
      await this.#router.navigate(HOME_ROUTE_COMMANDS);

      return;
    }

    this.status.set(check === TokenCheck.unauthorized ? TokenSaveStatus.unauthorized : TokenSaveStatus.error);
  }

  clear(): void {
    this.#adminToken.clear();
    this.status.set(TokenSaveStatus.idle);
  }

  async saveMeta(startTime: string, announcement: string): Promise<void> {
    const meta = buildSiteMeta(startTime, announcement);

    await this.#siteMeta.save(meta);

    if (this.metaState() === PublishState.success) {
      this.meta.set(meta);
    }
  }

  async #loadMeta(): Promise<void> {
    try {
      this.meta.set(await this.#siteMeta.load());
    } catch {
      // The editor still opens on a CDN hiccup; saving publishes a fresh file anyway.
      this.meta.set({ ...EMPTY_SITE_META });
    }
  }
}

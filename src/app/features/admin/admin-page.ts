import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { TokenCheck } from '../../core/github/token-check.enum';
import { AdminTokenService } from '../../github/admin-token.service';
import { EMPTY_TOKEN, TOKEN_HELP_URL } from './admin-page.constant';
import { TokenSaveStatus, TokenSaveStatusType } from './admin-page.enum';
import { HOME_ROUTE_COMMANDS } from './admin.guard.constant';

/** The /admin page: the organiser pastes a fine-grained GitHub PAT; a valid one unlocks the publish wizard. */
@Component({
  selector: 'app-admin-page',
  templateUrl: './admin-page.html',
  styleUrl: './admin-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPage {
  readonly #adminToken = inject(AdminTokenService);
  readonly #router = inject(Router);

  readonly status = signal<TokenSaveStatusType>(TokenSaveStatus.idle);
  readonly isAdmin = this.#adminToken.isAdmin;

  protected readonly statuses = TokenSaveStatus;
  protected readonly tokenHelpUrl = TOKEN_HELP_URL;

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
}

import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import {
  ATHLETES_PAGE_LINK,
  CREATOR_SITE_URL,
  HOME_PAGE_LINK,
  MAIN_CONTENT_ID,
  RACES_LIST_PAGE_LINK,
  VK_COMMUNITY_URL,
} from './app.constant';
import { ADMIN_PAGE_LINK } from './features/admin/admin-page.constant';
import { RECORDS_PAGE_LINK } from './features/records/records-page.constant';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly #document = inject(DOCUMENT);

  protected readonly homeLink = HOME_PAGE_LINK;
  protected readonly racesLink = RACES_LIST_PAGE_LINK;
  protected readonly recordsLink = RECORDS_PAGE_LINK;
  protected readonly athletesLink = ATHLETES_PAGE_LINK;
  protected readonly adminLink = ADMIN_PAGE_LINK;
  protected readonly creatorUrl = CREATOR_SITE_URL;
  protected readonly vkUrl = VK_COMMUNITY_URL;

  /** `href="#main"` would resolve against `<base href>` and reload the app, so focus is moved manually. */
  skipToMain(event: Event): void {
    event.preventDefault();
    this.#document.getElementById(MAIN_CONTENT_ID)?.focus();
  }
}

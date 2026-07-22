import { ChangeDetectionStrategy, Component, DOCUMENT, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import {
  CREATOR_SITE_URL,
  HOME_PAGE_LINK,
  MAIN_CONTENT_ID,
  RACES_LIST_PAGE_LINK,
  VERSUS_PAGE_LINK,
  VK_COMMUNITY_URL,
} from './app.constant';
import { APP_VERSION } from './core/app-version.constant';
import { ADMIN_PAGE_LINK } from './features/admin/admin-page.constant';
import { GUIDE_PAGE_LINK } from './features/guide/guide-page.constant';
import { RECORDS_PAGE_LINK } from './features/records/records-page.constant';
import { YEAR_PAGE_BASE_LINK } from './features/year/year-page.constant';
import { DbFreshnessBanner } from './shared/db-freshness-banner/db-freshness-banner';
import { LogoMark } from './shared/logo-mark/logo-mark';
import { SelfPicker } from './shared/self-picker/self-picker';

@Component({
  selector: 'app-root',
  imports: [DbFreshnessBanner, LogoMark, SelfPicker, RouterOutlet, RouterLink, RouterLinkActive, MatToolbarModule, MatButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly #document = inject(DOCUMENT);

  protected readonly homeLink = HOME_PAGE_LINK;
  protected readonly racesLink = RACES_LIST_PAGE_LINK;
  protected readonly recordsLink = RECORDS_PAGE_LINK;
  protected readonly versusLink = VERSUS_PAGE_LINK;
  protected readonly yearLink = YEAR_PAGE_BASE_LINK;
  protected readonly guideLink = GUIDE_PAGE_LINK;
  protected readonly adminLink = ADMIN_PAGE_LINK;
  protected readonly creatorUrl = CREATOR_SITE_URL;
  protected readonly vkUrl = VK_COMMUNITY_URL;
  protected readonly version = APP_VERSION;

  /** `href="#main"` would resolve against `<base href>` and reload the app, so focus is moved manually. */
  skipToMain(event: Event): void {
    event.preventDefault();
    this.#document.getElementById(MAIN_CONTENT_ID)?.focus();
  }

  /**
   * The organizer link lives in the footer, so tapping it would otherwise open
   * `/admin` still scrolled to the very bottom (the router keeps the position).
   */
  scrollToTop(): void {
    this.#document.defaultView?.scrollTo({ top: 0, behavior: 'instant' });
  }
}

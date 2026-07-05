import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { VK_COMMUNITY_URL } from '../../app.constant';
import { EMPTY_SITE_META } from '../../core/github/site-meta.constant';
import { AdminTokenService } from '../../github/admin-token.service';
import { ArchiveService } from '../../github/archive.service';
import { SiteMetaService } from '../../github/site-meta.service';
import { toRaceListItem } from '../races/race-list-item';
import { RaceCard } from '../races/race-card/race-card';
import { RacesStatus, RacesStatusType } from '../races/races-page.enum';
import { RaceListItem } from '../races/races-page.interface';
import { LATEST_RACES_COUNT, RACES_PAGE_LINK, UPLOAD_PAGE_LINK } from './home-page.constant';

/** The landing page: hero, announcement, the latest races preview and the course card. */
@Component({
  selector: 'app-home-page',
  imports: [RaceCard, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly #archive = inject(ArchiveService);
  readonly #adminToken = inject(AdminTokenService);
  readonly #siteMeta = inject(SiteMetaService);

  readonly status = signal<RacesStatusType>(RacesStatus.loading);
  readonly latestRaces = signal<RaceListItem[]>([]);
  readonly isAdmin = this.#adminToken.isAdmin;
  readonly siteMeta = signal(EMPTY_SITE_META);
  readonly hasAnnouncement = computed(() => this.siteMeta().startTime !== '' || this.siteMeta().announcement !== '');

  protected readonly statuses = RacesStatus;
  protected readonly uploadLink = UPLOAD_PAGE_LINK;
  protected readonly racesLink = RACES_PAGE_LINK;
  protected readonly vkUrl = VK_COMMUNITY_URL;

  constructor() {
    // Prerender bakes the calm loading state into static HTML; live data arrives after hydration.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.#load();
      void this.#loadMeta();
    }
  }

  async #load(): Promise<void> {
    try {
      const index = await this.#archive.loadIndex();

      this.latestRaces.set(index.events.slice(0, LATEST_RACES_COUNT).map(toRaceListItem));
      this.status.set(index.events.length === 0 ? RacesStatus.empty : RacesStatus.ready);
    } catch {
      this.status.set(RacesStatus.error);
    }
  }

  /** The announcement is optional decoration, so a CDN failure keeps the page silent instead of erroring. */
  async #loadMeta(): Promise<void> {
    try {
      this.siteMeta.set(await this.#siteMeta.load());
    } catch {
      this.siteMeta.set(EMPTY_SITE_META);
    }
  }
}

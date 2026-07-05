import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { VK_COMMUNITY_URL } from '../../app.constant';
import { EMPTY_SITE_META } from '../../core/github/site-meta.constant';
import { loadWithTransfer } from '../../core/transfer/transfer-load';
import { ArchiveService } from '../../github/archive.service';
import { SiteMetaService } from '../../github/site-meta.service';
import { toRaceListItem } from '../races/race-list-item';
import { RaceCard } from '../races/race-card/race-card';
import { RacesStatus, RacesStatusType } from '../races/races-page.enum';
import { RaceListItem } from '../races/races-page.interface';
import { HOME_META_TRANSFER_KEY, HOME_RACES_TRANSFER_KEY, LATEST_RACES_COUNT, RACES_PAGE_LINK } from './home-page.constant';

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
  readonly #siteMeta = inject(SiteMetaService);

  readonly status = signal<RacesStatusType>(RacesStatus.loading);
  readonly latestRaces = signal<RaceListItem[]>([]);
  readonly siteMeta = signal(EMPTY_SITE_META);
  readonly hasAnnouncement = computed(() => this.siteMeta().startTime !== '' || this.siteMeta().announcement !== '');

  protected readonly statuses = RacesStatus;
  protected readonly racesLink = RACES_PAGE_LINK;
  protected readonly vkUrl = VK_COMMUNITY_URL;

  constructor() {
    // Prerender bakes the real preview and announcement into the static HTML, so hydration
    // shifts no layout; the browser still refreshes from the CDN — data lands between deploys.
    loadWithTransfer({
      key: HOME_RACES_TRANSFER_KEY,
      load: () => this.#loadLatest(),
      apply: (races) => this.#applyLatest(races),
      onError: () => this.status.set(RacesStatus.error),
    });
    // The announcement is optional decoration, so a CDN failure keeps the page silent instead of erroring.
    loadWithTransfer({
      key: HOME_META_TRANSFER_KEY,
      load: () => this.#siteMeta.load(),
      apply: (meta) => this.siteMeta.set(meta),
      onError: () => this.siteMeta.set(EMPTY_SITE_META),
    });
  }

  /** Only the preview slice travels through TransferState — the full index would bloat the HTML. */
  async #loadLatest(): Promise<RaceListItem[]> {
    const index = await this.#archive.loadIndex();

    return index.events.slice(0, LATEST_RACES_COUNT).map(toRaceListItem);
  }

  #applyLatest(races: RaceListItem[]): void {
    this.latestRaces.set(races);
    this.status.set(races.length === 0 ? RacesStatus.empty : RacesStatus.ready);
  }
}

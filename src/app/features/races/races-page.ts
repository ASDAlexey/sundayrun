import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { VK_COMMUNITY_URL } from '../../app.constant';
import { ArchiveIndexEntry } from '../../core/github/archive-index.interface';
import { jsDelivrFileUrl } from '../../core/github/jsdelivr';
import { EMPTY_SITE_META } from '../../core/github/site-meta.constant';
import { formatRussianDateLong } from '../../core/time/russian-date';
import { AdminTokenService } from '../../github/admin-token.service';
import { ArchiveService } from '../../github/archive.service';
import { SiteMetaService } from '../../github/site-meta.service';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { UPLOAD_PAGE_LINK } from './races-page.constant';
import { RacesStatus, RacesStatusType } from './races-page.enum';
import { RaceListItem } from './races-page.interface';

/** The home page: the published race list (newest first, as served) plus the admin entry points. */
@Component({
  selector: 'app-races-page',
  imports: [RouterLink],
  templateUrl: './races-page.html',
  styleUrl: './races-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RacesPage {
  readonly #archive = inject(ArchiveService);
  readonly #adminToken = inject(AdminTokenService);
  readonly #siteMeta = inject(SiteMetaService);

  readonly status = signal<RacesStatusType>(RacesStatus.loading);
  readonly races = signal<RaceListItem[]>([]);
  readonly isAdmin = this.#adminToken.isAdmin;
  readonly siteMeta = signal(EMPTY_SITE_META);
  readonly hasAnnouncement = computed(() => this.siteMeta().startTime !== '' || this.siteMeta().announcement !== '');

  protected readonly statuses = RacesStatus;
  protected readonly uploadLink = UPLOAD_PAGE_LINK;
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

      this.races.set(index.events.map(toListItem));
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

/** The index arrives already sorted newest-first; entries are only reshaped, never re-sorted. */
function toListItem(entry: ArchiveIndexEntry): RaceListItem {
  return {
    slug: entry.slug,
    protocolLink: [RACE_PAGE_BASE_LINK, entry.slug],
    number: entry.number,
    dateLong: formatRussianDateLong(entry.dateIso),
    city: entry.city,
    park: entry.park,
    participantCount: entry.participantCount,
    pdfUrl: jsDelivrFileUrl(entry.files.protocolPdf),
    // i18n attributes with interpolation are dropped by the compiler, so the label is localized here.
    pdfAriaLabel: $localize`:@@races.pdfAriaLabel:Протокол пробега № ${entry.number}:number: (PDF)`,
  };
}

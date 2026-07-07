import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';

import { VK_COMMUNITY_URL } from '../../app.constant';
import { EMPTY_SITE_META } from '../../core/github/site-meta.constant';
import { OverallStats } from '../../core/history/overall-stats.interface';
import { formatDuration } from '../../core/time/duration';
import { loadWithTransfer } from '../../core/transfer/transfer-load';
import { ArchiveService } from '../../github/archive.service';
import { AthletesService } from '../../github/athletes.service';
import { CdnRefService } from '../../github/cdn-ref.service';
import { SiteMetaService } from '../../github/site-meta.service';
import { toRaceListItem } from '../races/race-list-item';
import { RaceCard } from '../races/race-card/race-card';
import { RacesStatus, RacesStatusType } from '../races/races-page.enum';
import { RaceListItem } from '../races/races-page.interface';
import {
  HOME_META_TRANSFER_KEY,
  HOME_RACES_TRANSFER_KEY,
  HOME_STATS_TRANSFER_KEY,
  LATEST_RACES_COUNT,
  NO_MEDIAN_TIME_PLACEHOLDER,
  RACES_PAGE_LINK,
  STATS_AVERAGE_FORMAT,
  STATS_NUMBER_FORMAT,
} from './home-page.constant';
import { HomeStatsView } from './home-page.interface';

/** The landing page: hero, announcement, the latest races preview and the course card. */
@Component({
  selector: 'app-home-page',
  imports: [MatButtonModule, MatProgressSpinnerModule, RaceCard, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly #archive = inject(ArchiveService);
  readonly #cdnRef = inject(CdnRefService);
  readonly #siteMeta = inject(SiteMetaService);
  readonly #athletes = inject(AthletesService);
  readonly #stats = signal<OverallStats | null>(null);

  readonly status = signal<RacesStatusType>(RacesStatus.loading);
  readonly latestRaces = signal<RaceListItem[]>([]);
  readonly siteMeta = signal(EMPTY_SITE_META);
  readonly hasAnnouncement = computed(() => this.siteMeta().startTime !== '' || this.siteMeta().announcement !== '');
  readonly statsView = computed(() => toStatsView(this.#stats()));

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
    // Only the tiny computed totals travel through TransferState, never the athletes history itself.
    loadWithTransfer({
      key: HOME_STATS_TRANSFER_KEY,
      load: () => this.#athletes.loadOverallStats(),
      apply: (stats) => this.#stats.set(stats),
      onError: () => this.#stats.set(null),
    });
  }

  /** Only the preview slice travels through TransferState — the full index would bloat the HTML. */
  async #loadLatest(): Promise<RaceListItem[]> {
    const latest = await this.#archive.loadLatest(LATEST_RACES_COUNT);
    const ref = await this.#cdnRef.resolve();

    return latest.map((entry) => toRaceListItem(entry, ref));
  }

  #applyLatest(races: RaceListItem[]): void {
    this.latestRaces.set(races);
    this.status.set(races.length === 0 ? RacesStatus.empty : RacesStatus.ready);
  }
}

/** Formats the totals for display; the block hides until at least one event is published. */
function toStatsView(stats: OverallStats | null): HomeStatsView | null {
  if (stats === null || stats.eventsCount === 0) {
    return null;
  }

  return {
    events: STATS_NUMBER_FORMAT.format(stats.eventsCount),
    finishes: STATS_NUMBER_FORMAT.format(stats.finishesCount),
    finishers: STATS_NUMBER_FORMAT.format(stats.finishersCount),
    averageFinishes: STATS_AVERAGE_FORMAT.format(stats.averageFinishes),
    medianTimeMen: formatMedianTime(stats.medianTimeMenMs),
    medianTimeWomen: formatMedianTime(stats.medianTimeWomenMs),
  };
}

/** A gender with no 5 km finishes yet shows a dash instead of a zero time. */
function formatMedianTime(medianMs: number): string {
  return medianMs === 0 ? NO_MEDIAN_TIME_PLACEHOLDER : formatDuration(medianMs);
}

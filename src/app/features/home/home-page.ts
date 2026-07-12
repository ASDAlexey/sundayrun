import { ChangeDetectionStrategy, Component, DestroyRef, afterNextRender, computed, inject, signal } from '@angular/core';
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
import { SiteMetaService } from '../../github/site-meta.service';
import { ReloadButton } from '../../shared/reload-button/reload-button';
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
import { COUNTDOWN_TICK_MS, DEFAULT_START_TIME } from './next-start.constant';
import { NextStartView } from './next-start.interface';
import { formatCountdown, formatStartDate, nextStartAt } from './next-start';

/** The landing page: hero with a live "next start" countdown, the latest races preview and the course card. */
@Component({
  selector: 'app-home-page',
  imports: [MatButtonModule, MatProgressSpinnerModule, RaceCard, ReloadButton, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  readonly #archive = inject(ArchiveService);
  readonly #siteMeta = inject(SiteMetaService);
  readonly #athletes = inject(AthletesService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #stats = signal<OverallStats | null>(null);

  // Null until the first browser render sets it, so the prerendered/hydrated markup carries the
  // static placeholder — no server clock, no hydration mismatch — before the countdown goes live.
  readonly #nowMs = signal<number | null>(null);

  readonly status = signal<RacesStatusType>(RacesStatus.loading);
  readonly latestRaces = signal<RaceListItem[]>([]);
  readonly siteMeta = signal(EMPTY_SITE_META);
  readonly hasAnnouncement = computed(() => this.siteMeta().startTime !== '' || this.siteMeta().announcement !== '');
  readonly statsView = computed(() => toStatsView(this.#stats()));
  readonly startTime = computed(() => this.siteMeta().startTime || DEFAULT_START_TIME);
  readonly nextStart = computed<NextStartView | null>(() => toNextStartView(this.#nowMs(), this.startTime()));

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
    // Browser-only: start the clock after the first render (never on the server), so the countdown
    // lights up post-hydration and ticks every second until the page is torn down.
    afterNextRender(() => {
      const tick = (): void => this.#nowMs.set(Date.now());

      tick();

      const timer = setInterval(tick, COUNTDOWN_TICK_MS);

      this.#destroyRef.onDestroy(() => clearInterval(timer));
    });
  }

  /** Only the preview slice travels through TransferState — the full index would bloat the HTML. */
  async #loadLatest(): Promise<RaceListItem[]> {
    const latest = await this.#archive.loadLatest(LATEST_RACES_COUNT);

    return latest.map((entry) => toRaceListItem(entry));
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

/** Builds the live card view; null before the browser clock starts, keeping the placeholder on screen. */
function toNextStartView(nowMs: number | null, startTime: string): NextStartView | null {
  if (nowMs === null) {
    return null;
  }

  const target = nextStartAt(new Date(nowMs), startTime);

  return { dateLabel: formatStartDate(target), startTime, countdown: formatCountdown(target.getTime() - nowMs) };
}

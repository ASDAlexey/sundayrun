import { Component, DOCUMENT, DestroyRef, afterNextRender, computed, effect, inject, signal, untracked } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { ATHLETES_PAGE_LINK, VK_COMMUNITY_URL } from '../../app.constant';
import { EMPTY_SITE_META } from '../../core/github/site-meta.constant';
import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { OverallStats } from '../../core/history/overall-stats.interface';
import { athleteStreaks } from '../../core/history/streaks';
import { AthleteRecord, AthleteRun } from '../../core/models/athlete-history.interface';
import { formatDuration } from '../../core/time/duration';
import { loadWithTransfer } from '../../core/transfer/transfer-load';
import { ArchiveService } from '../../github/archive.service';
import { AthletesService } from '../../github/athletes.service';
import { SiteMetaService } from '../../github/site-meta.service';
import { CountUp } from '../../shared/directives/count-up/count-up';
import { ScrollReveal } from '../../shared/directives/scroll-reveal/scroll-reveal';
import { LoadingState } from '../../shared/loading-state/loading-state';
import { OfflineNotice } from '../../shared/offline-notice/offline-notice';
import { ReloadButton } from '../../shared/reload-button/reload-button';
import { RollNumber } from '../../shared/roll-number/roll-number';
import { CourseTrack } from './course-track/course-track';
import { SelfAthlete } from '../../state/self-athlete.interface';
import { SelfAthleteService } from '../../state/self-athlete.service';
import { NO_BEST_TIME_TEXT } from '../athlete/athlete-page.constant';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { toRaceListItems } from '../races/race-list-item';
import { RaceCard } from '../races/race-card/race-card';
import { RacesStatus, RacesStatusType } from '../races/races-page.enum';
import { TREND_WINDOW_SIZE } from '../races/races-page.constant';
import { RaceListItem } from '../races/races-page.interface';
import { YEAR_PAGE_BASE_LINK } from '../year/year-page.constant';
import {
  HOME_META_TRANSFER_KEY,
  HOME_RACES_TRANSFER_KEY,
  HOME_STATS_TRANSFER_KEY,
  LATEST_RACES_COUNT,
  NO_MEDIAN_TIME_PLACEHOLDER,
  RACES_PAGE_LINK,
  SCROLL_HINT_LISTENER_OPTIONS,
  STATS_AVERAGE_FORMAT,
  STATS_NUMBER_FORMAT,
} from './home-page.constant';
import { HomeSelfView, HomeStatsView } from './home-page.interface';
import { COUNTDOWN_TICK_MS, DEFAULT_START_TIME } from './next-start.constant';
import { NextStartView } from './next-start.interface';
import {
  formatCountdown,
  formatStartDate,
  formatStartTimeLabel,
  isLastSundayOfMonth,
  nextStartAt,
  registrationTimeLabel,
} from './next-start';

/** The landing page: hero with a live "next start" countdown, the latest races preview and the course card. */
@Component({
  selector: 'app-home-page',
  imports: [
    CountUp,
    CourseTrack,
    LoadingState,
    MatButtonModule,
    OfflineNotice,
    RaceCard,
    ReloadButton,
    RollNumber,
    RouterLink,
    ScrollReveal,
  ],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  readonly #archive = inject(ArchiveService);
  readonly #siteMeta = inject(SiteMetaService);
  readonly #athletes = inject(AthletesService);
  readonly #selfAthlete = inject(SelfAthleteService);
  readonly #destroyRef = inject(DestroyRef);
  readonly #document = inject(DOCUMENT);
  readonly #stats = signal<OverallStats | null>(null);
  readonly #selfRecord = signal<AthleteRecord | null>(null);
  readonly #eventSlugs = signal<string[]>([]);

  // Null until the first browser render sets it, so the prerendered/hydrated markup carries the
  // static placeholder — no server clock, no hydration mismatch — before the countdown goes live.
  readonly #nowMs = signal<number | null>(null);

  readonly status = signal<RacesStatusType>(RacesStatus.loading);
  readonly latestRaces = signal<RaceListItem[]>([]);
  readonly siteMeta = signal(EMPTY_SITE_META);
  readonly statsView = computed(() => toStatsView(this.#stats()));
  readonly selfView = computed(() => toSelfView(this.#selfAthlete.self(), this.#selfRecord(), this.#eventSlugs()));
  readonly startTime = computed(() => this.siteMeta().startTime || DEFAULT_START_TIME);
  readonly startLabel = computed(() => formatStartTimeLabel(this.startTime()));
  readonly registrationLabel = computed(() => registrationTimeLabel(this.startTime()));
  readonly nextStart = computed<NextStartView | null>(() => toNextStartView(this.#nowMs(), this.startTime()));

  // Rendered only before the first scroll of the session; see the constructor.
  readonly scrollHintVisible = signal(false);

  protected readonly statuses = RacesStatus;
  protected readonly numberFormat = STATS_NUMBER_FORMAT.format;
  protected readonly racesLink = RACES_PAGE_LINK;
  protected readonly yearLink = YEAR_PAGE_BASE_LINK;
  protected readonly vkUrl = VK_COMMUNITY_URL;

  constructor() {
    // Prerender bakes the real preview and start time into the static HTML, so hydration
    // shifts no layout; the browser still refreshes from the CDN — data lands between deploys.
    // `trustBaked`: the preview, start time and totals all ship in the same deploy as this HTML, so
    // the prerendered value is already current — the browser skips the refetch that used to make the
    // bulk of the page's db range requests. The self card below stays live: it is never prerendered.
    loadWithTransfer({
      key: HOME_RACES_TRANSFER_KEY,
      load: () => this.#loadLatest(),
      apply: (races) => this.#applyLatest(races),
      onError: () => this.status.set(RacesStatus.error),
      trustBaked: true,
    });
    // The start time is optional decoration, so a CDN failure falls back to the default instead of erroring.
    loadWithTransfer({
      key: HOME_META_TRANSFER_KEY,
      load: () => this.#siteMeta.load(),
      apply: (meta) => this.siteMeta.set(meta),
      onError: () => this.siteMeta.set(EMPTY_SITE_META),
      trustBaked: true,
    });
    // Only the tiny computed totals travel through TransferState, never the athletes history itself.
    loadWithTransfer({
      key: HOME_STATS_TRANSFER_KEY,
      load: () => this.#athletes.loadOverallStats(),
      apply: (stats) => this.#stats.set(stats),
      onError: () => this.#stats.set(null),
      trustBaked: true,
    });
    // The personal card follows the header pick live; the server never holds one, so prerender skips it.
    effect(() => {
      const self = this.#selfAthlete.self();

      if (self !== null && untracked(this.#selfRecord)?.key !== self.key) {
        void this.#loadSelf(self.key);
      }
    });
    // Browser-only: start the clock after the first render (never on the server), so the countdown
    // lights up post-hydration and ticks every second until the page is torn down.
    afterNextRender(() => {
      const tick = (): void => this.#nowMs.set(Date.now());

      tick();

      const timer = setInterval(tick, COUNTDOWN_TICK_MS);

      this.#destroyRef.onDestroy(() => clearInterval(timer));
      this.#armScrollHint();
    });
  }

  /**
   * In an in-app browser the hero can fill the screen with no visible seam, and half the
   * audience arrives there from a Telegram link. The hint says «there is more below» and
   * then gets out of the way permanently — it has done its job the moment it is obeyed.
   *
   * A visitor who is already scrolled (a restored position, a deep link) never sees it.
   */
  #armScrollHint(): void {
    const view = this.#document.defaultView;

    if (view === null) {
      return;
    }

    if (view.scrollY !== 0) {
      return;
    }

    const hide = (): void => this.scrollHintVisible.set(false);

    this.scrollHintVisible.set(true);
    view.addEventListener('scroll', hide, SCROLL_HINT_LISTENER_OPTIONS);
    this.#destroyRef.onDestroy(() => view.removeEventListener('scroll', hide));
  }

  /**
   * Only the preview slice travels through TransferState — the full index would bloat the HTML.
   * The dynamics chart of each card reads the preceding weeks, so the query over-fetches the
   * window as context and the list is cut back to the preview size after the reshaping.
   */
  async #loadLatest(): Promise<RaceListItem[]> {
    const latest = await this.#archive.loadLatest(LATEST_RACES_COUNT + TREND_WINDOW_SIZE - 1);

    return toRaceListItems(latest).slice(0, LATEST_RACES_COUNT);
  }

  #applyLatest(races: RaceListItem[]): void {
    this.latestRaces.set(races);
    this.status.set(races.length === 0 ? RacesStatus.empty : RacesStatus.ready);
  }

  /** The personal card is optional garnish: a failed read keeps the page silent. */
  async #loadSelf(key: string): Promise<void> {
    try {
      const [record, eventSlugs] = await Promise.all([this.#athletes.loadRecord(key), this.#athletes.loadEventSlugs()]);

      this.#selfRecord.set(record);
      this.#eventSlugs.set(eventSlugs);
    } catch {
      this.#selfRecord.set(null);
    }
  }
}

/** Formats the totals for display; the block hides until at least one event is published. */
function toStatsView(stats: OverallStats | null): HomeStatsView | null {
  if (stats === null || stats.eventsCount === 0) {
    return null;
  }

  return {
    events: STATS_NUMBER_FORMAT.format(stats.eventsCount),
    eventsCount: stats.eventsCount,
    finishes: STATS_NUMBER_FORMAT.format(stats.finishesCount),
    finishesCount: stats.finishesCount,
    finishers: STATS_NUMBER_FORMAT.format(stats.finishersCount),
    finishersCount: stats.finishersCount,
    averageFinishes: STATS_AVERAGE_FORMAT.format(stats.averageFinishes),
    medianTimeMen: formatMedianTime(stats.medianTimeMenMs),
    medianTimeWomen: formatMedianTime(stats.medianTimeWomenMs),
  };
}

/** A stale record from the previous pick must not flash under the new name, hence the key check. */
function toSelfView(self: SelfAthlete | null, record: AthleteRecord | null, eventSlugs: string[]): HomeSelfView | null {
  if (self === null || record?.key !== self.key) {
    return null;
  }

  const fiveKmRuns = record.runs.filter((run) => run.distanceKm === FIVE_KM_DISTANCE_KM);
  const streaks = athleteStreaks(record.participationSlugs, record.runs, eventSlugs);
  // The card is browser-only (the pick lives in localStorage), so the client clock is the season.
  const year = String(new Date().getFullYear());
  const yearRuns = fiveKmRuns.filter((run) => run.dateIso.startsWith(`${year}-`));
  const yearBestMs = record.bestMsByYear[year];
  const bestRun = record.bestMs === null ? null : firstRunWith(fiveKmRuns, record.bestMs);
  const yearBestRun = yearBestMs === undefined ? null : firstRunWith(yearRuns, yearBestMs);

  return {
    displayName: record.displayName,
    athleteLink: [ATHLETES_PAGE_LINK, record.key],
    finishesText: STATS_NUMBER_FORMAT.format(fiveKmRuns.length),
    bestTimeText: record.bestMs === null ? NO_BEST_TIME_TEXT : formatDuration(record.bestMs),
    bestTimeLink: bestRun === null ? null : [RACE_PAGE_BASE_LINK, bestRun.slug],
    streakText: STATS_NUMBER_FORMAT.format(streaks.currentWeeks),
    finishesYearText: STATS_NUMBER_FORMAT.format(yearRuns.length),
    bestTimeYearText: yearBestMs === undefined ? NO_BEST_TIME_TEXT : formatDuration(yearBestMs),
    bestTimeYearLink: yearBestRun === null ? null : [RACE_PAGE_BASE_LINK, yearBestRun.slug],
  };
}

/**
 * The race where a personal best was *first* set. A tie goes to the earlier run, matching how
 * the rest of the site treats records: whoever got there first keeps them.
 */
function firstRunWith(runs: AthleteRun[], timeMs: number): AthleteRun | null {
  const matches = runs.filter((run) => run.timeMs === timeMs).sort((a, b) => a.dateIso.localeCompare(b.dateIso));

  return matches[0] ?? null;
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

  return {
    dateLabel: formatStartDate(target),
    startTime: formatStartTimeLabel(startTime),
    countdown: formatCountdown(target.getTime() - nowMs),
    isMonthFinal: isLastSundayOfMonth(target),
  };
}

import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { pluralText } from '../../core/i18n/plural-text';
import { createTransferLoader } from '../../core/transfer/transfer-load';
import { YearBestResult, YearReview } from '../../core/history/year-review.interface';
import { formatRaceTime } from '../../core/time/duration';
import { formatRussianDateShort } from '../../core/time/russian-date';
import { YearReviewService } from '../../github/year-review.service';
import { LoadingState } from '../../shared/loading-state/loading-state';
import { OfflineNotice } from '../../shared/offline-notice/offline-notice';
import { ReloadButton } from '../../shared/reload-button/reload-button';
import { PAGE_META_CLAUSE_SEPARATOR } from '../../shared/seo/page-meta.constant';
import { PageMetaService } from '../../shared/seo/page-meta.service';
import { YearBadgeChip } from '../../shared/year-badge/year-badge';
import { ATHLETES_PAGE_LINK } from '../../app.constant';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { YEAR_LATEST_KEY, YEAR_PAGE_BASE_LINK, YEAR_PODIUM_SIZE, YEAR_ROUTE_PARAM, YEAR_TRANSFER_KEY_PREFIX } from './year-page.constant';
import { YearStatus, YearStatusType } from './year-page.enum';
import { RaceTime } from '../../shared/race-time/race-time';
import {
  YearActiveView,
  YearBadgeGroupView,
  YearBestRowView,
  YearPageState,
  YearProgressRowView,
  YearReviewView,
  YearStatView,
} from './year-page.interface';

/** «Итоги года»: the year's totals, best results, most active finishers and badge holders. */
@Component({
  selector: 'app-year-page',
  imports: [LoadingState, OfflineNotice, ReloadButton, RouterLink, YearBadgeChip, RaceTime],
  templateUrl: './year-page.html',
  styleUrl: './year-page.scss',
})
export class YearPage {
  readonly #reviews = inject(YearReviewService);
  readonly #pageMeta = inject(PageMetaService);

  readonly status = signal<YearStatusType>(YearStatus.loading);
  readonly years = signal<string[]>([]);
  readonly view = signal<YearReviewView | null>(null);

  protected readonly statuses = YearStatus;
  protected readonly yearBaseLink = YEAR_PAGE_BASE_LINK;
  protected readonly podiumSize = YEAR_PODIUM_SIZE;

  #requestedYear: string | null = null;

  constructor() {
    // The loader is captured once here; each navigation runs its own year-keyed transfer load.
    const load = createTransferLoader();

    // Same-route navigation reuses the component instance, so the year is tracked reactively.
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        const requestedYear = params.get(YEAR_ROUTE_PARAM);

        this.#requestedYear = requestedYear;
        this.status.set(YearStatus.loading);
        this.view.set(null);
        // Prerender bakes the review under `year.review.<year>` (`latest` for the parameterless
        // `/year`); the browser trusts it (`trustBaked`) and skips the reads a direct load made.
        load({
          key: `${YEAR_TRANSFER_KEY_PREFIX}${requestedYear ?? YEAR_LATEST_KEY}`,
          load: () => this.#resolveState(requestedYear),
          apply: (state) => this.#applyState(requestedYear, state),
          onError: () => this.#applyState(requestedYear, { status: YearStatus.error, years: [], view: null }),
          trustBaked: true,
        });
      });
  }

  /** A newer navigation may have taken over while the review was loading, so the year is rechecked. */
  #applyState(requestedYear: string | null, state: YearPageState): void {
    if (requestedYear !== this.#requestedYear) {
      return;
    }

    this.years.set(state.years);
    this.view.set(state.view);
    this.status.set(state.status);
    // «Итоги года» is shared as a link of its own, so its preview describes the season, not the site.
    this.#pageMeta.setDescription(yearDescriptionOf(state.view));
  }

  /**
   * No param → the newest year; an unknown year (or an empty archive) maps to notFound. A failed
   * read rejects, and the transfer loader's `onError` turns it into the error state.
   */
  async #resolveState(requestedYear: string | null): Promise<YearPageState> {
    const years = await this.#reviews.loadYears();
    const year = requestedYear ?? years[0] ?? null;

    if (year === null || !years.includes(year)) {
      return { status: YearStatus.notFound, years, view: null };
    }

    const review = await this.#reviews.loadReview(year);

    return { status: YearStatus.ready, years, view: toReviewView(review) };
  }
}

/**
 * The link-preview sentence of one season — «Итоги 2026 года — Воскресный парковый пробег в
 * Таганроге. Лучшее время сезона: у мужчин 24:00,00 (Иванов Иван), у женщин 27:00,00 (Петрова
 * Вера)». Empty for a state carrying no review, which restores the site description.
 */
function yearDescriptionOf(view: YearReviewView | null): string {
  if (view === null) {
    return '';
  }

  const headline = $localize`:@@year.metaHeadline:Итоги ${view.year}:year: года — Воскресный парковый пробег в Таганроге`;
  const bests = bestClausesOf(view).join(PAGE_META_CLAUSE_SEPARATOR);

  if (bests === '') {
    return headline;
  }

  return $localize`:@@year.metaWithBests:${headline}:headline:. Лучшее время сезона: ${bests}:bests:`;
}

/** «у мужчин 24:00,00 (Иванов Иван)» per gender; a season nobody finished contributes no clause. */
function bestClausesOf(view: YearReviewView): string[] {
  const clauses: string[] = [];

  if (view.bestMen.length > 0) {
    const best = view.bestMen[0];

    clauses.push($localize`:@@year.metaBestMale:у мужчин ${best.timeText}:time: (${best.displayName}:name:)`);
  }

  if (view.bestWomen.length > 0) {
    const best = view.bestWomen[0];

    clauses.push($localize`:@@year.metaBestFemale:у женщин ${best.timeText}:time: (${best.displayName}:name:)`);
  }

  return clauses;
}

function toReviewView(review: YearReview): YearReviewView {
  return {
    year: review.year,
    stats: toStats(review),
    bestMen: review.bestMen.map(toBestRow),
    bestWomen: review.bestWomen.map(toBestRow),
    mostActive: review.mostActive.map(toActiveView),
    progress: review.progress.map(toProgressRow),
    badgeGroups: toBadgeGroups(review),
  };
}

function toStats(review: YearReview): YearStatView[] {
  const stats: YearStatView[] = [
    { label: $localize`:@@year.statEvents:забегов`, value: String(review.eventCount) },
    { label: $localize`:@@year.statFinishes:финишей`, value: String(review.finishCount) },
    { label: $localize`:@@year.statFinishers:участников финишировало`, value: String(review.finisherCount) },
    { label: $localize`:@@year.statNewcomers:новичков`, value: String(review.newcomerCount) },
    { label: $localize`:@@year.statRecords:личных рекордов`, value: String(review.personalRecordCount) },
  ];

  if (review.medianTimeMenMs !== null) {
    stats.push({ label: $localize`:@@year.statMedianMale:медиана мужчин · 5 км`, value: formatRaceTime(review.medianTimeMenMs) });
  }

  if (review.medianTimeWomenMs !== null) {
    stats.push({ label: $localize`:@@year.statMedianFemale:медиана женщин · 5 км`, value: formatRaceTime(review.medianTimeWomenMs) });
  }

  return stats;
}

function toBestRow(best: YearBestResult, index: number): YearBestRowView {
  return {
    place: index + 1,
    displayName: best.displayName,
    athleteLink: [ATHLETES_PAGE_LINK, best.key],
    timeText: formatRaceTime(best.timeMs),
    dateShort: formatRussianDateShort(best.dateIso),
    raceLink: [RACE_PAGE_BASE_LINK, best.slug],
  };
}

function toActiveView(active: YearReview['mostActive'][number], index: number): YearActiveView {
  return {
    place: index + 1,
    displayName: active.displayName,
    athleteLink: [ATHLETES_PAGE_LINK, active.key],
    countText: pluralText(active.finishCount, {
      one: $localize`:@@year.finishesOne:${active.finishCount}:count: финиш`,
      few: $localize`:@@year.finishesFew:${active.finishCount}:count: финиша`,
      many: $localize`:@@year.finishesMany:${active.finishCount}:count: финишей`,
    }),
  };
}

function toProgressRow(row: YearReview['progress'][number], index: number): YearProgressRowView {
  return {
    place: index + 1,
    displayName: row.displayName,
    athleteLink: [ATHLETES_PAGE_LINK, row.key],
    deltaText: `−${formatRaceTime(row.deltaMs)}`,
    mediansText: `${formatRaceTime(row.previousMedianMs)} → ${formatRaceTime(row.currentMedianMs)}`,
  };
}

function toBadgeGroups(review: YearReview): YearBadgeGroupView[] {
  return review.badgeHolders.map((group) => ({
    badge: group.badge,
    holders: group.holders.map((holder) => ({ displayName: holder.displayName, athleteLink: [ATHLETES_PAGE_LINK, holder.key] })),
  }));
}

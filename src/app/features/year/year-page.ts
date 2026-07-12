import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { pluralText } from '../../core/i18n/plural-text';
import { YearBestResult, YearReview } from '../../core/history/year-review.interface';
import { formatDuration } from '../../core/time/duration';
import { YearReviewService } from '../../github/year-review.service';
import { ReloadButton } from '../../shared/reload-button/reload-button';
import { YearBadgeChip } from '../../shared/year-badge/year-badge';
import { ATHLETES_PAGE_LINK } from '../../app.constant';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { YEAR_PAGE_BASE_LINK, YEAR_ROUTE_PARAM } from './year-page.constant';
import { YearStatus, YearStatusType } from './year-page.enum';
import { YearActiveView, YearBadgeGroupView, YearBestResultView, YearReviewView, YearStatView } from './year-page.interface';

/** «Итоги года»: the year's totals, best results, most active finishers and badge holders. */
@Component({
  selector: 'app-year-page',
  imports: [MatProgressSpinnerModule, ReloadButton, RouterLink, YearBadgeChip],
  templateUrl: './year-page.html',
  styleUrl: './year-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YearPage {
  readonly #reviews = inject(YearReviewService);

  readonly status = signal<YearStatusType>(YearStatus.loading);
  readonly years = signal<string[]>([]);
  readonly view = signal<YearReviewView | null>(null);

  protected readonly statuses = YearStatus;
  protected readonly yearBaseLink = YEAR_PAGE_BASE_LINK;

  #requestedYear: string | null = null;

  constructor() {
    // Same-route navigation reuses the component instance, so the year is tracked reactively.
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.#requestedYear = params.get(YEAR_ROUTE_PARAM);
        void this.#load(this.#requestedYear);
      });
  }

  async #load(requestedYear: string | null): Promise<void> {
    this.status.set(YearStatus.loading);
    this.view.set(null);

    const next = await this.#resolveState(requestedYear);

    // A newer navigation may have taken over while the review was loading.
    if (requestedYear !== this.#requestedYear) {
      return;
    }

    this.years.set(next.years);
    this.view.set(next.view);
    this.status.set(next.status);
  }

  /** No param → the newest year; an unknown year (or an empty archive) maps to notFound. */
  async #resolveState(requestedYear: string | null): Promise<{ status: YearStatusType; years: string[]; view: YearReviewView | null }> {
    try {
      const years = await this.#reviews.loadYears();
      const year = requestedYear ?? years[0] ?? null;

      if (year === null || !years.includes(year)) {
        return { status: YearStatus.notFound, years, view: null };
      }

      const review = await this.#reviews.loadReview(year);

      return { status: YearStatus.ready, years, view: toReviewView(review) };
    } catch {
      return { status: YearStatus.error, years: [], view: null };
    }
  }
}

function toReviewView(review: YearReview): YearReviewView {
  return {
    year: review.year,
    stats: toStats(review),
    bests: [
      ...toBestView($localize`:@@year.bestMale:Лучший результат года · М`, review.bestMale),
      ...toBestView($localize`:@@year.bestFemale:Лучший результат года · Ж`, review.bestFemale),
    ],
    mostActive: review.mostActive.map(toActiveView),
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
    stats.push({ label: $localize`:@@year.statMedianMale:медиана мужчин · 5 км`, value: formatDuration(review.medianTimeMenMs) });
  }

  if (review.medianTimeWomenMs !== null) {
    stats.push({ label: $localize`:@@year.statMedianFemale:медиана женщин · 5 км`, value: formatDuration(review.medianTimeWomenMs) });
  }

  return stats;
}

function toBestView(label: string, best: YearBestResult | null): YearBestResultView[] {
  if (best === null) {
    return [];
  }

  return [
    {
      label,
      displayName: best.displayName,
      athleteLink: [ATHLETES_PAGE_LINK, best.key],
      timeText: formatDuration(best.timeMs),
      raceLink: [RACE_PAGE_BASE_LINK, best.slug],
    },
  ];
}

function toActiveView(active: YearReview['mostActive'][number]): YearActiveView {
  return {
    displayName: active.displayName,
    athleteLink: [ATHLETES_PAGE_LINK, active.key],
    countText: pluralText(active.finishCount, {
      one: $localize`:@@year.finishesOne:${active.finishCount}:count: финиш`,
      few: $localize`:@@year.finishesFew:${active.finishCount}:count: финиша`,
      many: $localize`:@@year.finishesMany:${active.finishCount}:count: финишей`,
    }),
  };
}

function toBadgeGroups(review: YearReview): YearBadgeGroupView[] {
  return review.badgeHolders.map((group) => ({
    badge: group.badge,
    holders: group.holders.map((holder) => ({ displayName: holder.displayName, athleteLink: [ATHLETES_PAGE_LINK, holder.key] })),
  }));
}

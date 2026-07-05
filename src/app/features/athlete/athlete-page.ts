import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { normalizeAthleteKey } from '../../core/history/athlete-key';
import { distinctRunYears, filterRuns, sortRuns, yearBestEntries } from '../../core/history/athlete-runs';
import { RunsSort, RunsSortType } from '../../core/history/athlete-runs.enum';
import { YearBestEntry } from '../../core/history/athlete-runs.interface';
import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { formatDuration } from '../../core/time/duration';
import { formatRussianDateShort } from '../../core/time/russian-date';
import { AthletesService } from '../../github/athletes.service';
import { ATHLETES_PAGE_LINK, NO_BEST_TIME_TEXT } from '../athletes/athletes-page.constant';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { KEY_ROUTE_PARAM } from './athlete-page.constant';
import { AthleteStatus, AthleteStatusType } from './athlete-page.enum';
import { AthletePageState, AthleteRunView, YearBestView } from './athlete-page.interface';

/** One athlete's history: participation counters, 5 km records, and every 5 km run with a year filter. */
@Component({
  selector: 'app-athlete-page',
  imports: [RouterLink],
  templateUrl: './athlete-page.html',
  styleUrl: './athlete-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthletePage {
  readonly #athletes = inject(AthletesService);
  readonly #record = signal<AthletePageState['record']>(null);
  // The whole page is about the full distance: one-lap runs never reach the table or the filters.
  readonly #fiveKmRuns = computed(() => filterRuns(this.#record()?.runs ?? [], null, FIVE_KM_DISTANCE_KM));

  readonly status = signal<AthleteStatusType>(AthleteStatus.loading);
  readonly year = signal<string | null>(null);
  readonly sort = signal<RunsSortType>(RunsSort.byTime);

  readonly displayName = computed(() => this.#record()?.displayName ?? '');
  readonly participationCount = computed(() => this.#record()?.participationSlugs.length ?? 0);
  readonly finishCount = computed(() => this.#fiveKmRuns().length);
  readonly bestTimeText = computed(() => toTimeText(this.#record()?.bestMs ?? null));
  readonly yearBests = computed(() => yearBestEntries(this.#record()?.bestMsByYear ?? {}).map(toYearBestView));
  readonly years = computed(() => distinctRunYears(this.#fiveKmRuns()));
  readonly runs = computed(() => sortRuns(filterRuns(this.#fiveKmRuns(), this.year(), null), this.sort()).map(toRunView));

  protected readonly statuses = AthleteStatus;
  protected readonly sorts = RunsSort;
  protected readonly athletesLink = ATHLETES_PAGE_LINK;

  #key = '';

  constructor() {
    // Same-route navigation reuses the component instance, so the key is tracked reactively.
    inject(ActivatedRoute)
      .paramMap.pipe(takeUntilDestroyed())
      .subscribe((params) => {
        this.#key = normalizeAthleteKey(params.get(KEY_ROUTE_PARAM) ?? '');
        void this.#load(this.#key);
      });
  }

  setYear(year: string | null): void {
    this.year.set(year);
  }

  setSort(sort: RunsSortType): void {
    this.sort.set(sort);
  }

  async #load(key: string): Promise<void> {
    this.status.set(AthleteStatus.loading);
    this.#record.set(null);
    this.year.set(null);
    this.sort.set(RunsSort.byTime);

    const next = await this.#resolveState(key);

    // A newer navigation may have taken over while the history was loading.
    if (key !== this.#key) {
      return;
    }

    this.#record.set(next.record);
    this.status.set(next.status);
  }

  async #resolveState(key: string): Promise<AthletePageState> {
    try {
      const record = (await this.#athletes.loadHistory())[key] ?? null;

      if (record === null) {
        return { status: AthleteStatus.notFound, record: null };
      }

      return { status: AthleteStatus.ready, record };
    } catch {
      return { status: AthleteStatus.error, record: null };
    }
  }
}

function toRunView(run: AthleteRun): AthleteRunView {
  return {
    slug: run.slug,
    raceLink: [RACE_PAGE_BASE_LINK, run.slug],
    dateShort: formatRussianDateShort(run.dateIso),
    timeText: formatDuration(run.timeMs),
  };
}

function toYearBestView(entry: YearBestEntry): YearBestView {
  return { year: entry.year, timeText: formatDuration(entry.timeMs) };
}

function toTimeText(bestMs: number | null): string {
  return bestMs === null ? NO_BEST_TIME_TEXT : formatDuration(bestMs);
}

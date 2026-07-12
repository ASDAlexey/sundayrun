import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { normalizeAthleteKey } from '../../core/history/athlete-key';
import { athleteStreaks } from '../../core/history/streaks';
import { AthleteStreaks } from '../../core/history/streaks.interface';
import { athleteYearBadges } from '../../core/history/year-badges';
import { distinctRunYears, filterRuns, sortRuns, yearBestEntries } from '../../core/history/athlete-runs';
import { RunsSort, RunsSortType } from '../../core/history/athlete-runs.enum';
import { YearBestEntry } from '../../core/history/athlete-runs.interface';
import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { pluralText } from '../../core/i18n/plural-text';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { formatDuration } from '../../core/time/duration';
import { formatRussianDateShort } from '../../core/time/russian-date';
import { AthletesService } from '../../github/athletes.service';
import { ReloadButton } from '../../shared/reload-button/reload-button';
import { YearBadgeChip } from '../../shared/year-badge/year-badge';
import { ATHLETES_PAGE_LINK, VERSUS_PAGE_LINK } from '../../app.constant';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { ALL_YEARS_VALUE } from '../races/races-page.constant';
import { KEY_ROUTE_PARAM, NO_BEST_TIME_TEXT, RUNS_TABLE_COLUMNS } from './athlete-page.constant';
import { AthleteStatus, AthleteStatusType } from './athlete-page.enum';
import { AthletePageState, AthleteRunView, StreaksView, YearBestView } from './athlete-page.interface';
import { ProgressChart } from './progress-chart';

/** One athlete's history: participation counters, 5 km records, and every 5 km run with a year filter. */
@Component({
  selector: 'app-athlete-page',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressSpinnerModule,
    MatTableModule,
    ProgressChart,
    ReloadButton,
    RouterLink,
    YearBadgeChip,
  ],
  templateUrl: './athlete-page.html',
  styleUrl: './athlete-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AthletePage {
  readonly #athletes = inject(AthletesService);
  readonly #record = signal<AthletePageState['record']>(null);
  readonly #firstEventDateByYear = signal<AthletePageState['firstEventDateByYear']>({});
  readonly #eventSlugs = signal<AthletePageState['eventSlugs']>([]);
  // The whole page is about the full distance: one-lap runs never reach the table or the filters.
  readonly #fiveKmRuns = computed(() => filterRuns(this.#record()?.runs ?? [], null, FIVE_KM_DISTANCE_KM));

  readonly status = signal<AthleteStatusType>(AthleteStatus.loading);
  readonly year = signal<string | null>(null);
  readonly sort = signal<RunsSortType>(RunsSort.byTime);

  readonly displayName = computed(() => this.#record()?.displayName ?? '');
  readonly participationCount = computed(() => this.#record()?.participationSlugs.length ?? 0);
  readonly finishCount = computed(() => this.#fiveKmRuns().length);
  /** The chart gets the full 5 km history plus the year filter, so the all-time record stays known in a year view. */
  readonly progressRuns = this.#fiveKmRuns;
  readonly bestTimeText = computed(() => toTimeText(this.#record()?.bestMs ?? null));
  /** Badges count every finished run (the short course included); badge-less years are omitted. */
  readonly yearBadges = computed(() => athleteYearBadges(this.#record()?.runs ?? [], this.#firstEventDateByYear()));
  /** Streaks count participations (a DNF still extends one) over the full event chronology. */
  readonly streaks = computed(() =>
    toStreaksView(athleteStreaks(this.#record()?.participationSlugs ?? [], this.#record()?.runs ?? [], this.#eventSlugs())),
  );

  readonly yearBests = computed(() => yearBestEntries(this.#record()?.bestMsByYear ?? {}).map(toYearBestView));
  readonly years = computed(() => distinctRunYears(this.#fiveKmRuns()));
  readonly runs = computed(() => sortRuns(filterRuns(this.#fiveKmRuns(), this.year(), null), this.sort()).map(toRunView));
  /** The duel page with this athlete preselected: «сколько раз встречались и кто был впереди». */
  readonly versusLink = computed(() => [VERSUS_PAGE_LINK, this.#record()?.key ?? '']);

  protected readonly statuses = AthleteStatus;
  protected readonly sorts = RunsSort;
  protected readonly athletesLink = ATHLETES_PAGE_LINK;
  protected readonly allYearsValue = ALL_YEARS_VALUE;
  protected readonly runsTableColumns = RUNS_TABLE_COLUMNS;

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

  /** The toggle group carries the "all" sentinel because a toggle value cannot be `null`. */
  onYearChange(value: string): void {
    this.setYear(value === ALL_YEARS_VALUE ? null : value);
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
    this.#firstEventDateByYear.set(next.firstEventDateByYear);
    this.#eventSlugs.set(next.eventSlugs);
    this.status.set(next.status);
  }

  async #resolveState(key: string): Promise<AthletePageState> {
    try {
      const [record, firstEventDateByYear, eventSlugs] = await Promise.all([
        this.#athletes.loadRecord(key),
        this.#athletes.loadFirstEventDateByYear(),
        this.#athletes.loadEventSlugs(),
      ]);

      if (record === null) {
        return { status: AthleteStatus.notFound, record: null, firstEventDateByYear: {}, eventSlugs: [] };
      }

      return { status: AthleteStatus.ready, record, firstEventDateByYear, eventSlugs };
    } catch {
      return { status: AthleteStatus.error, record: null, firstEventDateByYear: {}, eventSlugs: [] };
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

function toStreaksView(streaks: AthleteStreaks): StreaksView {
  return { currentText: weeksText(streaks.currentWeeks), maxText: weeksText(streaks.maxWeeks), rageCount: streaks.rageCount };
}

/** «1 неделя / 2 недели / 5 недель» — each plural form is a separate translatable message. */
function weeksText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@athlete.streakWeeksOne:${count}:count: неделя`,
    few: $localize`:@@athlete.streakWeeksFew:${count}:count: недели`,
    many: $localize`:@@athlete.streakWeeksMany:${count}:count: недель`,
  });
}

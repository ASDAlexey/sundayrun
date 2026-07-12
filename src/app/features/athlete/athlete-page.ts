import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { normalizeAthleteKey } from '../../core/history/athlete-key';
import { legendBoard, legendProgress } from '../../core/history/legend';
import { LEGEND_WINDOW_DAYS } from '../../core/history/legend.constant';
import { LegendProgress } from '../../core/history/legend.interface';
import { athleteStreaks } from '../../core/history/streaks';
import { AthleteStreaks } from '../../core/history/streaks.interface';
import { athleteYearBadges } from '../../core/history/year-badges';
import { distinctRunYears, filterRuns, sortRuns, yearBestEntries } from '../../core/history/athlete-runs';
import { RunsSort, RunsSortType } from '../../core/history/athlete-runs.enum';
import { YearBestEntry } from '../../core/history/athlete-runs.interface';
import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { monthFinalSlugs } from '../../core/history/month-finals';
import { athletePlacements } from '../../core/history/placements';
import { AthletePlacements } from '../../core/history/placements.interface';
import { pluralText } from '../../core/i18n/plural-text';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { formatDuration } from '../../core/time/duration';
import { isoToday } from '../../core/time/iso-today';
import { formatRussianDateShort } from '../../core/time/russian-date';
import { AthletesService } from '../../github/athletes.service';
import { ReloadButton } from '../../shared/reload-button/reload-button';
import { YearBadgeChip } from '../../shared/year-badge/year-badge';
import { ATHLETES_PAGE_LINK, VERSUS_PAGE_LINK } from '../../app.constant';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { ALL_YEARS_VALUE } from '../races/races-page.constant';
import { KEY_ROUTE_PARAM, NO_BEST_TIME_TEXT, NO_PLACE_TEXT, RUNS_TABLE_COLUMNS } from './athlete-page.constant';
import { AthleteStatus, AthleteStatusType } from './athlete-page.enum';
import { AthletePageState, AthleteRunView, LegendView, PlacementsView, StreaksView, YearBestView } from './athlete-page.interface';
import { ProgressChart } from './progress-chart';

/** One athlete's history: participation counters, 5 km records, and every 5 km run with a year filter. */
@Component({
  selector: 'app-athlete-page',
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressBarModule,
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
  readonly #badgeRarity = signal<AthletePageState['badgeRarity']>({});
  readonly #legendFinishes = signal<AthletePageState['legendFinishes']>([]);
  readonly #runPlaces = signal<AthletePageState['runPlaces']>({});
  readonly #todayIso = isoToday();
  /** The month-final events («итоговые») of the archive; the still-open current month marks none. */
  readonly #monthFinals = computed(() => monthFinalSlugs(this.#eventSlugs(), this.#todayIso));
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
  /** Badge → the share of participants owning it — «есть у 12% участников» on the chips. */
  readonly badgeRarity = this.#badgeRarity.asReadonly();
  /** Streaks count participations (a DNF still extends one) over the full event chronology. */
  readonly streaks = computed(() =>
    toStreaksView(athleteStreaks(this.#record()?.participationSlugs ?? [], this.#record()?.runs ?? [], this.#eventSlugs())),
  );

  /** «Легенда трассы»: the transferable rolling-window crown for showing up, the pace never matters. */
  readonly legend = computed(() => toLegendView(legendProgress(legendBoard(this.#legendFinishes()), this.#record()?.key ?? '')));

  /** The «Итоговые забеги» card: the best place at finals vs regular races and the finals podium tally. */
  readonly placements = computed(() => toPlacementsView(athletePlacements(this.#runPlaces(), this.#monthFinals())));

  readonly yearBests = computed(() => {
    const bestMs = this.#record()?.bestMs ?? null;
    const runs = this.#record()?.runs ?? [];

    return yearBestEntries(this.#record()?.bestMsByYear ?? {}, runs).map((entry) => toYearBestView(entry, bestMs));
  });
  readonly years = computed(() => distinctRunYears(this.#fiveKmRuns()));
  readonly runs = computed(() =>
    sortRuns(filterRuns(this.#fiveKmRuns(), this.year(), null), this.sort()).map((run) =>
      toRunView(run, this.#runPlaces(), this.#monthFinals()),
    ),
  );

  /** The duel page with this athlete preselected: «сколько раз встречались и кто был впереди». */
  readonly versusLink = computed(() => [VERSUS_PAGE_LINK, this.#record()?.key ?? '']);

  protected readonly statuses = AthleteStatus;
  protected readonly sorts = RunsSort;
  protected readonly athletesLink = ATHLETES_PAGE_LINK;
  protected readonly allYearsValue = ALL_YEARS_VALUE;
  protected readonly runsTableColumns = RUNS_TABLE_COLUMNS;
  protected readonly legendWindowDays = LEGEND_WINDOW_DAYS;

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
    this.#badgeRarity.set(next.badgeRarity);
    this.#legendFinishes.set(next.legendFinishes);
    this.#runPlaces.set(next.runPlaces);
    this.status.set(next.status);
  }

  async #resolveState(key: string): Promise<AthletePageState> {
    try {
      const [record, firstEventDateByYear, eventSlugs, badgeRarity, legendFinishes, runPlaces] = await Promise.all([
        this.#athletes.loadRecord(key),
        this.#athletes.loadFirstEventDateByYear(),
        this.#athletes.loadEventSlugs(),
        this.#athletes.loadYearBadgeRarity(),
        this.#athletes.loadLegendFinishes(),
        this.#athletes.loadRunPlaces(key),
      ]);

      if (record === null) {
        return {
          status: AthleteStatus.notFound,
          record: null,
          firstEventDateByYear: {},
          eventSlugs: [],
          badgeRarity: {},
          legendFinishes: [],
          runPlaces: {},
        };
      }

      return { status: AthleteStatus.ready, record, firstEventDateByYear, eventSlugs, badgeRarity, legendFinishes, runPlaces };
    } catch {
      return {
        status: AthleteStatus.error,
        record: null,
        firstEventDateByYear: {},
        eventSlugs: [],
        badgeRarity: {},
        legendFinishes: [],
        runPlaces: {},
      };
    }
  }
}

function toRunView(run: AthleteRun, places: Record<string, number>, monthFinals: Set<string>): AthleteRunView {
  const place = places[run.slug];

  return {
    slug: run.slug,
    raceLink: [RACE_PAGE_BASE_LINK, run.slug],
    dateShort: formatRussianDateShort(run.dateIso),
    timeText: formatDuration(run.timeMs),
    // Old protocols published without places simply show the dash.
    placeText: place === undefined ? NO_PLACE_TEXT : String(place),
    isMonthFinal: monthFinals.has(run.slug),
  };
}

function toYearBestView(entry: YearBestEntry, bestMs: number | null): YearBestView {
  return {
    year: entry.year,
    timeText: formatDuration(entry.timeMs),
    raceLink: [RACE_PAGE_BASE_LINK, entry.slug],
    isAllTime: entry.timeMs === bestMs,
  };
}

function toTimeText(bestMs: number | null): string {
  return bestMs === null ? NO_BEST_TIME_TEXT : formatDuration(bestMs);
}

function toPlacementsView(placements: AthletePlacements): PlacementsView {
  return {
    bestFinalPlace: placements.bestFinalPlace,
    bestRegularPlace: placements.bestRegularPlace,
    podiumTexts: toPodiumTexts(placements),
    hasPlaces: placements.bestFinalPlace !== null || placements.bestRegularPlace !== null,
  };
}

/** «1-е место ×3» — a chip per podium step; a step never taken at a final is omitted. */
function toPodiumTexts(placements: AthletePlacements): string[] {
  const texts: string[] = [];

  if (placements.firstFinalCount > 0) {
    texts.push($localize`:@@athlete.finalsFirstPlaces:1-е место ×${placements.firstFinalCount}:count:`);
  }

  if (placements.secondFinalCount > 0) {
    texts.push($localize`:@@athlete.finalsSecondPlaces:2-е место ×${placements.secondFinalCount}:count:`);
  }

  if (placements.thirdFinalCount > 0) {
    texts.push($localize`:@@athlete.finalsThirdPlaces:3-е место ×${placements.thirdFinalCount}:count:`);
  }

  return texts;
}

function toStreaksView(streaks: AthleteStreaks): StreaksView {
  return { currentText: weeksText(streaks.currentWeeks), maxText: weeksText(streaks.maxWeeks), rageCount: streaks.rageCount };
}

/** The crown fills the bar; a chaser sees their share of the count that would take it over. */
function toLegendView(progress: LegendProgress): LegendView {
  return {
    isLegend: progress.isLegend,
    countText: finishesText(progress.finishCount),
    legendName: progress.legend?.displayName ?? null,
    legendCountText: finishesText(progress.legend?.finishCount ?? 0),
    toCrownText: finishesText(progress.finishesToCrown),
    progressPercent: progress.isLegend ? 100 : Math.round((100 * progress.finishCount) / (progress.finishCount + progress.finishesToCrown)),
  };
}

/** «1 финиш / 2 финиша / 5 финишей» — each plural form is a separate translatable message. */
function finishesText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@athlete.legendFinishesOne:${count}:count: финиш`,
    few: $localize`:@@athlete.legendFinishesFew:${count}:count: финиша`,
    many: $localize`:@@athlete.legendFinishesMany:${count}:count: финишей`,
  });
}

/** «1 неделя / 2 недели / 5 недель» — each plural form is a separate translatable message. */
function weeksText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@athlete.streakWeeksOne:${count}:count: неделя`,
    few: $localize`:@@athlete.streakWeeksFew:${count}:count: недели`,
    many: $localize`:@@athlete.streakWeeksMany:${count}:count: недель`,
  });
}

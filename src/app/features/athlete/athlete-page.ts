import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { normalizeAthleteKey } from '../../core/history/athlete-key';
import { AthleteFirstLap } from '../../core/history/first-lap.interface';
import { currentCourseRecordEntries } from '../../core/history/course-records';
import { EMPTY_COURSE_RECORD_HISTORY } from '../../core/history/course-records.constant';
import { legendBoard, legendProgress } from '../../core/history/legend';
import { LEGEND_WINDOW_DAYS } from '../../core/history/legend.constant';
import { newestEventIso } from '../../core/history/runner-scores';
import { LegendProgress } from '../../core/history/legend.interface';
import { isoYear } from '../../core/history/iso-year';
import { athleteStreaks } from '../../core/history/streaks';
import { AthleteStreaks } from '../../core/history/streaks.interface';
import { athleteYearActivity, athleteYearBadges } from '../../core/history/year-badges';
import { YearBadge, YearBadgeType } from '../../core/history/year-badges.enum';
import { EventWeatherRow } from '../../core/history/weather-records.interface';
import { athleteSeasonRankBadges } from '../../core/history/season-ranks';
import { athleteYearRankBadges } from '../../core/history/year-ranks';
import { distinctRunYears, filterRuns, sortRuns, yearBestEntries } from '../../core/history/athlete-runs';
import { RunsSort, RunsSortType } from '../../core/history/athlete-runs.enum';
import { YearBestEntry } from '../../core/history/athlete-runs.interface';
import { FIVE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { memeStandings } from '../../core/history/meme-thresholds';
import { MEME_THRESHOLDS } from '../../core/history/meme-thresholds.constant';
import { MemeStanding } from '../../core/history/meme-thresholds.interface';
import { monthFinalSlugs } from '../../core/history/month-finals';
import { athletePlacements } from '../../core/history/placements';
import { AthletePlacements } from '../../core/history/placements.interface';
import { closeRivals } from '../../core/history/rivals';
import { CLOSE_FINISH_GAP_MS } from '../../core/history/rivals.constant';
import { Rival } from '../../core/history/rivals.interface';
import { pluralText } from '../../core/i18n/plural-text';
import { AthleteRun } from '../../core/models/athlete-history.interface';
import { formatDuration } from '../../core/time/duration';
import { MS_IN_SECOND } from '../../core/time/duration.constant';
import { isoToday } from '../../core/time/iso-today';
import { formatRussianDateShort } from '../../core/time/russian-date';
import { AthletesService } from '../../github/athletes.service';
import { ReloadButton } from '../../shared/reload-button/reload-button';
import { YearBadgeChip } from '../../shared/year-badge/year-badge';
import { ATHLETES_PAGE_LINK, VERSUS_PAGE_LINK } from '../../app.constant';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { ALL_YEARS_VALUE } from '../races/races-page.constant';
import { KEY_ROUTE_PARAM, NO_BEST_TIME_TEXT, NO_PLACE_TEXT, RUNS_TABLE_COLUMNS, SELF_MEME_KEY } from './athlete-page.constant';
import { AthleteStatus, AthleteStatusType } from './athlete-page.enum';
import {
  AthletePageState,
  AthleteRunView,
  FirstLapView,
  LegendView,
  MemeRowView,
  PlacementsView,
  RivalView,
  StreaksView,
  YearBestView,
} from './athlete-page.interface';
import { BadgeCatalog } from './badge-catalog/badge-catalog';
import { FormCard } from './form-card';
import { LifetimeCard } from './lifetime-card';
import { PacingCard } from './pacing-card';
import { ProgressChart } from './progress-chart';
import { RatingCard } from './rating-card';
import { WeatherCard } from './weather-card';

/** One athlete's history: participation counters, 5 km records, and every 5 km run with a year filter. */
@Component({
  selector: 'app-athlete-page',
  imports: [
    BadgeCatalog,
    FormCard,
    LifetimeCard,
    MatButtonModule,
    MatButtonToggleModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTableModule,
    PacingCard,
    ProgressChart,
    RatingCard,
    ReloadButton,
    RouterLink,
    WeatherCard,
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
  readonly #rivalRuns = signal<AthletePageState['rivalRuns']>([]);
  readonly #bestFirstLap = signal<AthletePageState['bestFirstLap']>(null);
  readonly #firstLaps = signal<AthletePageState['firstLaps']>([]);
  readonly #yearBests = signal<AthletePageState['yearBests']>([]);
  readonly #seasonBests = signal<AthletePageState['seasonBests']>([]);
  readonly #courseRecords = signal<AthletePageState['courseRecords']>(EMPTY_COURSE_RECORD_HISTORY);
  readonly #winnerEvents = signal<AthletePageState['winnerEvents']>([]);
  readonly #weatherRows = signal<EventWeatherRow[]>([]);
  readonly #todayIso = isoToday();
  /** The month-final events («итоговые») of the archive; the still-open current month marks none. */
  readonly #monthFinals = computed(() => monthFinalSlugs(this.#eventSlugs(), this.#todayIso));
  // The whole page is about the full distance: one-lap runs never reach the table or the filters.
  readonly #fiveKmRuns = computed(() => filterRuns(this.#record()?.runs ?? [], null, FIVE_KM_DISTANCE_KM));
  /**
   * The ranking crowns per year, merged in front of the activity badges: the standing course
   * record and the athlete's cut in the year's best-times table. The current season recomputes
   * on every visit, so its badge can still slip away; finished years never change.
   */
  readonly #rankBadgesByYear = computed(() => {
    const record = this.#record();

    if (record === null) {
      return {};
    }

    const byYear: Record<string, YearBadgeType[]> = {};
    const courseCrown = currentCourseRecordEntries(this.#courseRecords()).find((entry) => entry.key === record.key);

    if (courseCrown !== undefined) {
      byYear[isoYear(courseCrown.dateIso)] = [YearBadge.courseKing];
    }

    for (const [year, badge] of Object.entries(athleteYearRankBadges(this.#yearBests(), record.key))) {
      (byYear[year] ??= []).push(badge);
    }

    // The season crowns and podiums follow the year crown within each year's row.
    for (const [year, badges] of Object.entries(athleteSeasonRankBadges(this.#seasonBests(), record.key))) {
      (byYear[year] ??= []).push(...badges);
    }

    return byYear;
  });

  /** Year → the fastest recorded first-lap split of that year; a tie stays with the earlier run. */
  readonly #lapBestByYear = computed(() => {
    const byYear = new Map<string, AthleteFirstLap>();

    for (const lap of this.#firstLaps()) {
      const year = isoYear(lap.dateIso);
      const known = byYear.get(year);

      if (known === undefined || lap.lapMs < known.lapMs || (lap.lapMs === known.lapMs && lap.dateIso < known.dateIso)) {
        byYear.set(year, lap);
      }
    }

    return byYear;
  });

  readonly status = signal<AthleteStatusType>(AthleteStatus.loading);
  readonly year = signal<string | null>(null);
  readonly rivalsYear = signal<string | null>(null);
  readonly sort = signal<RunsSortType>(RunsSort.byTime);

  readonly displayName = computed(() => this.#record()?.displayName ?? '');
  readonly participationCount = computed(() => this.#record()?.participationSlugs.length ?? 0);
  readonly finishCount = computed(() => this.#fiveKmRuns().length);
  /** «23/45» — the finals the athlete showed up at (a DNF counts, as in «участий») over every final ever held. */
  readonly finalsAttendanceText = computed(() => {
    const finals = this.#monthFinals();

    if (finals.size === 0) {
      return null;
    }

    const attended = (this.#record()?.participationSlugs ?? []).filter((slug) => finals.has(slug)).length;

    return `${attended}/${finals.size}`;
  });

  /** The chart gets the full 5 km history plus the year filter, so the all-time record stays known in a year view. */
  readonly progressRuns = this.#fiveKmRuns;
  /** The «Цифры за всё время» card counts every finish, the short course included. */
  readonly allRuns = computed(() => this.#record()?.runs ?? []);
  readonly bestTimeText = computed(() => toTimeText(this.#record()?.bestMs ?? null));
  /** The «Лучший первый круг · 2,3 км» profile value; hidden while no run carries a recorded split. */
  readonly firstLap = computed(() => toFirstLapView(this.#bestFirstLap()));
  /** The «Раскладка» card joins these with the 5 km runs by slug itself. */
  readonly firstLaps = this.#firstLaps.asReadonly();
  /** Badges count every finished run (the short course included); badge-less years are omitted. */
  readonly yearBadges = computed(() =>
    athleteYearBadges(this.#record()?.runs ?? [], this.#firstEventDateByYear(), this.#rankBadgesByYear()),
  );

  /** Badge → the share of participants owning it — «есть у 12% участников» on the chips. */
  readonly badgeRarity = this.#badgeRarity.asReadonly();
  /** «Король» chips read as «Королева» on a woman's page. */
  readonly gender = computed(() => this.#record()?.gender ?? null);
  /** The «Рейтинг» card sources: the score denominators and the record the grade divides by. */
  readonly winnerEvents = this.#winnerEvents.asReadonly();
  /** The archive's newest event day anchors the form staleness — no wall clock, like the rating. */
  readonly formAnchorIso = computed(() => newestEventIso(this.#winnerEvents()));
  readonly courseRecords = this.#courseRecords.asReadonly();
  /** The «Погодные рекорды» card joins the runs with the stored per-event weather itself. */
  readonly weatherRows = this.#weatherRows.asReadonly();
  /** The running calendar year of the badge-progress lines. */
  readonly currentYear = isoYear(this.#todayIso);
  /** The running year's activity — the «Все награды» catalog teases the next badge with it. */
  readonly currentActivity = computed(() =>
    athleteYearActivity(this.#record()?.runs ?? [], this.currentYear, this.#firstEventDateByYear()[this.currentYear]),
  );

  /** Streaks count participations (a DNF still extends one) over the full event chronology. */
  readonly streaks = computed(() =>
    toStreaksView(athleteStreaks(this.#record()?.participationSlugs ?? [], this.#record()?.runs ?? [], this.#eventSlugs())),
  );

  /** «Легенда трассы»: the transferable rolling-window crown for showing up, the pace never matters. */
  readonly legend = computed(() => toLegendView(legendProgress(legendBoard(this.#legendFinishes()), this.#record()?.key ?? '')));

  /** The «Итоговые забеги» card: the best place at finals vs regular races and the finals podium tally. */
  readonly placements = computed(() => toPlacementsView(athletePlacements(this.#runPlaces(), this.#monthFinals())));

  /** The «Соперники» card: who finished next to the athlete most often; its own year filter rescans the season. */
  readonly rivals = computed(() => {
    const key = this.#record()?.key ?? '';

    return closeRivals(this.#rivalRuns(), key, this.rivalsYear()).map((rival) => toRivalView(rival, key));
  });

  /** The card (with its year chips) stays while the all-time list is non-empty; a dry season only empties the list. */
  readonly hasRivals = computed(() => closeRivals(this.#rivalRuns(), this.#record()?.key ?? '', null).length > 0);

  /** The «Мем-пороги» ladder with the athlete's best slotted in; no best hides the card. */
  readonly memes = computed(() => {
    const bestMs = this.#record()?.bestMs ?? null;

    if (bestMs === null) {
      return [];
    }

    return toMemeRows(memeStandings(MEME_THRESHOLDS, bestMs), bestMs, this.displayName());
  });

  readonly yearBests = computed(() => {
    const bestMs = this.#record()?.bestMs ?? null;
    const runs = this.#record()?.runs ?? [];

    return yearBestEntries(this.#record()?.bestMsByYear ?? {}, runs).map((entry) => toYearBestView(entry, bestMs));
  });

  /** The first-lap twin of `yearBests`: one tile per year with a recorded 2.3 km split. */
  readonly lapYearBests = computed(() => {
    const bestLapMs = this.#bestFirstLap()?.lapMs ?? null;

    return [...this.#lapBestByYear().entries()]
      .sort(([left], [right]) => right.localeCompare(left))
      .map(([year, lap]) => ({
        year,
        timeText: formatDuration(lap.lapMs),
        raceLink: [RACE_PAGE_BASE_LINK, lap.slug],
        isAllTime: lap.lapMs === bestLapMs,
      }));
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
  protected readonly closeGapSeconds = CLOSE_FINISH_GAP_MS / MS_IN_SECOND;

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

  onRivalsYearChange(value: string): void {
    this.rivalsYear.set(value === ALL_YEARS_VALUE ? null : value);
  }

  setSort(sort: RunsSortType): void {
    this.sort.set(sort);
  }

  async #load(key: string): Promise<void> {
    this.status.set(AthleteStatus.loading);
    this.#record.set(null);
    this.year.set(null);
    this.rivalsYear.set(null);
    this.sort.set(RunsSort.byTime);

    // The weather card is garnish, so its rows ride outside the atomic state and a failed read leaves them empty.
    const [next, weatherRows] = await Promise.all([this.#resolveState(key), this.#athletes.loadWeatherRows().catch(() => [])]);

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
    this.#rivalRuns.set(next.rivalRuns);
    this.#bestFirstLap.set(next.bestFirstLap);
    this.#firstLaps.set(next.firstLaps);
    this.#yearBests.set(next.yearBests);
    this.#seasonBests.set(next.seasonBests);
    this.#courseRecords.set(next.courseRecords);
    this.#winnerEvents.set(next.winnerEvents);
    this.#weatherRows.set(weatherRows);
    this.status.set(next.status);
  }

  async #resolveState(key: string): Promise<AthletePageState> {
    try {
      const parts = await this.#loadParts(key);

      return parts.record === null ? emptyAthleteState(AthleteStatus.notFound) : { status: AthleteStatus.ready, ...parts };
    } catch {
      return emptyAthleteState(AthleteStatus.error);
    }
  }

  async #loadParts(key: string): Promise<Omit<AthletePageState, 'status'>> {
    const [
      record,
      firstEventDateByYear,
      eventSlugs,
      badgeRarity,
      legendFinishes,
      runPlaces,
      rivalRuns,
      bestFirstLap,
      firstLaps,
      yearBests,
      seasonBests,
      courseRecords,
      winnerEvents,
    ] = await Promise.all([
      this.#athletes.loadRecord(key),
      this.#athletes.loadFirstEventDateByYear(),
      this.#athletes.loadEventSlugs(),
      this.#athletes.loadYearBadgeRarity(),
      this.#athletes.loadLegendFinishes(),
      this.#athletes.loadRunPlaces(key),
      this.#athletes.loadRivalRuns(key),
      this.#athletes.loadBestFirstLap(key),
      this.#athletes.loadFirstLaps(key),
      this.#athletes.loadYearBests(),
      this.#athletes.loadSeasonBests(),
      this.#athletes.loadCourseRecords(),
      this.#athletes.loadEventWinnerTimes(),
    ]);

    return {
      record,
      firstEventDateByYear,
      eventSlugs,
      badgeRarity,
      legendFinishes,
      runPlaces,
      rivalRuns,
      bestFirstLap,
      firstLaps,
      yearBests,
      seasonBests,
      courseRecords,
      winnerEvents,
    };
  }
}

/** The record-less page state of the notFound and error outcomes. */
function emptyAthleteState(status: AthleteStatusType): AthletePageState {
  return {
    status,
    record: null,
    firstEventDateByYear: {},
    eventSlugs: [],
    badgeRarity: {},
    legendFinishes: [],
    runPlaces: {},
    rivalRuns: [],
    bestFirstLap: null,
    firstLaps: [],
    yearBests: [],
    seasonBests: [],
    courseRecords: EMPTY_COURSE_RECORD_HISTORY,
    winnerEvents: [],
  };
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

function toFirstLapView(lap: AthletePageState['bestFirstLap']): FirstLapView | null {
  if (lap === null) {
    return null;
  }

  return { timeText: formatDuration(lap.lapMs), raceLink: [RACE_PAGE_BASE_LINK, lap.slug] };
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

/** The athlete's own rung slots in right after the unbeaten benchmarks — the ladder stays time-sorted. */
function toMemeRows(standings: MemeStanding[], bestMs: number, displayName: string): MemeRowView[] {
  const rows = standings.map(toMemeRow);
  const selfIndex = standings.filter((standing) => !standing.isBeaten).length;

  rows.splice(selfIndex, 0, {
    key: SELF_MEME_KEY,
    name: displayName,
    note: null,
    timeText: formatDuration(bestMs),
    isBeaten: false,
    isSelf: true,
    gapText: null,
  });

  return rows;
}

function toMemeRow(standing: MemeStanding): MemeRowView {
  return {
    key: standing.key,
    name: standing.name,
    note: standing.note,
    timeText: formatDuration(standing.timeMs),
    isBeaten: standing.isBeaten,
    isSelf: false,
    gapText: standing.isNext ? formatDuration(standing.gapMs) : null,
  };
}

function toRivalView(rival: Rival, athleteKey: string): RivalView {
  return {
    key: rival.key,
    displayName: rival.displayName,
    versusLink: [VERSUS_PAGE_LINK, athleteKey, rival.key],
    closeText: closeTimesText(rival.closeCount),
    score: `${rival.wins}:${rival.losses}`,
  };
}

/** «1 раз / 2 раза / 5 раз рядом» — each plural form is a separate translatable message. */
function closeTimesText(count: number): string {
  return pluralText(count, {
    one: $localize`:@@athlete.rivalTimesOne:${count}:count: раз рядом`,
    few: $localize`:@@athlete.rivalTimesFew:${count}:count: раза рядом`,
    many: $localize`:@@athlete.rivalTimesMany:${count}:count: раз рядом`,
  });
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

import { ScrollingModule } from '@angular/cdk/scrolling';
import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ATHLETES_PAGE_LINK } from '../../app.constant';
import { normalizeAthleteKey } from '../../core/history/athlete-key';
import { NAME_COLLATION_LOCALE } from '../../core/history/athletes-list.constant';
import { bestResults, bestResultYears } from '../../core/history/best-results';
import { BestResult } from '../../core/history/best-results.interface';
import { EMPTY_COURSE_RECORD_HISTORY } from '../../core/history/course-records.constant';
import { CourseRecordEntry } from '../../core/history/course-records.interface';
import { CourseRecordHistory } from '../../core/history/course-records.type';
import { EMPTY_FIRST_LAP_RECORDS } from '../../core/history/first-lap.constant';
import { FirstLapRun } from '../../core/history/first-lap.interface';
import { FirstLapRecords } from '../../core/history/first-lap.type';
import { buildSeasonPositions } from '../../core/history/season-positions';
import { SeasonPositionLine, SeasonRun } from '../../core/history/season-positions.interface';
import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { Gender, GenderType } from '../../core/models/gender.enum';
import { formatDuration } from '../../core/time/duration';
import { formatRussianDateShort } from '../../core/time/russian-date';
import { AthletesService } from '../../github/athletes.service';
import { ReloadButton } from '../../shared/reload-button/reload-button';
import { RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { ALL_YEARS_VALUE } from '../races/races-page.constant';
import { BumpChart } from './bump-chart/bump-chart';
import {
  ALL_GENDERS_VALUE,
  CHART_SUGGESTION_LIMIT,
  KING_ALL_TIME_TEXT,
  KING_YEAR_PREFIX,
  QUEEN_ALL_TIME_TEXT,
  QUEEN_YEAR_PREFIX,
  RECORDS_PODIUM_SIZE,
  RECORDS_ROW_HEIGHT_PX,
  RECORDS_VIEW_QUERY_PARAM,
  RECORD_DELTA_SIGN,
} from './records-page.constant';
import { RecordsStatus, RecordsStatusType, RecordsView, RecordsViewType, SeasonMetric, SeasonMetricType } from './records-page.enum';
import { BestResultView, ChartPick, CourseRecordView, FirstLapRecordView } from './records-page.interface';

/**
 * Full 5 km leaderboards with a name search, season and gender filters, and virtual scroll.
 * The current record holder of each board wears the crown badge («Король/Королева трассы», or
 * «Король 2024» in a season view), and the course record progression renders as two timelines.
 * The «Гонка за сезон» view (also reachable via `/records?view=chart`) swaps the boards for the
 * season bump chart: the standings race of the chosen year (the newest one while the year filter
 * says «Все годы»), loaded lazily per season, with its own «find yourself» picker that keeps the
 * chosen athletes' lines lit on both charts.
 */
@Component({
  selector: 'app-records-page',
  imports: [BumpChart, MatProgressSpinnerModule, ReloadButton, RouterLink, ScrollingModule],
  templateUrl: './records-page.html',
  styleUrl: './records-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordsPage {
  readonly #athletes = inject(AthletesService);
  readonly #route = inject(ActivatedRoute);
  readonly #records = signal<AthleteRecord[]>([]);
  readonly #courseRecords = signal<CourseRecordHistory>(EMPTY_COURSE_RECORD_HISTORY);
  readonly #firstLapRecords = signal<FirstLapRecords>(EMPTY_FIRST_LAP_RECORDS);
  // The lambdas run lazily, so referencing the filter signals declared below is safe.
  readonly #menBoard = computed(() => toBoard(this.#records(), Gender.male, this.year()));
  readonly #womenBoard = computed(() => toBoard(this.#records(), Gender.female, this.year()));

  readonly #seasonRuns = signal<ReadonlyMap<string, SeasonRun[]>>(new Map());
  readonly #chartRuns = computed(() => {
    const year = this.chartYear();

    return year === null ? [] : (this.#seasonRuns().get(seasonCacheKey(year, this.chartMetric())) ?? []);
  });

  readonly #chartLines = computed(() => [...this.menPositions().lines, ...this.womenPositions().lines]);

  readonly status = signal<RecordsStatusType>(RecordsStatus.loading);
  readonly query = signal('');
  readonly year = signal<string | null>(null);
  readonly gender = signal<GenderType | null>(null);
  readonly view = signal<RecordsViewType>(this.#initialView());
  readonly chartMetric = signal<SeasonMetricType>(SeasonMetric.fiveKm);
  readonly chartStatus = signal<RecordsStatusType>(RecordsStatus.loading);
  readonly chartQuery = signal('');
  readonly chartPicks = signal<ChartPick[]>([]);

  readonly years = computed(() => bestResultYears(this.#records()));
  /** The season the chart draws: the year filter, or the newest season while it says «Все годы». */
  readonly chartYear = computed(() => this.year() ?? this.years()[0] ?? null);
  /** What the year toggle highlights: the chart view never highlights the absent «Все годы». */
  readonly yearSegValue = computed(() => (this.view() === RecordsView.chart ? this.chartYear() : this.year()));
  readonly menPositions = computed(() => buildSeasonPositions(this.#chartRuns(), Gender.male));
  readonly womenPositions = computed(() => buildSeasonPositions(this.#chartRuns(), Gender.female));
  /** Season athletes matching the chart search, minus the already picked ones. */
  readonly chartSuggestions = computed(() => suggestChartPicks(this.#chartLines(), this.chartQuery(), this.chartPicks()));
  readonly highlightedKeys = computed(() => this.chartPicks().map((pick) => pick.key));
  readonly men = computed(() => searchRows(this.#menBoard(), this.query()));
  readonly women = computed(() => searchRows(this.#womenBoard(), this.query()));
  /** Board sizes ignore the search box: the badge always shows how many athletes the board ranks. */
  readonly menCount = computed(() => this.#menBoard().length);
  readonly womenCount = computed(() => this.#womenBoard().length);
  readonly showMen = computed(() => this.gender() !== Gender.female);
  readonly showWomen = computed(() => this.gender() !== Gender.male);
  readonly noMatches = computed(() => (!this.showMen() || this.men().length === 0) && (!this.showWomen() || this.women().length === 0));
  readonly kingText = computed(() => crownText(KING_ALL_TIME_TEXT, KING_YEAR_PREFIX, this.year()));
  readonly queenText = computed(() => crownText(QUEEN_ALL_TIME_TEXT, QUEEN_YEAR_PREFIX, this.year()));
  readonly menRecordTimeline = computed(() => toTimeline(this.#courseRecords()[Gender.male]));
  readonly womenRecordTimeline = computed(() => toTimeline(this.#courseRecords()[Gender.female]));
  readonly menFirstLap = computed(() => toFirstLapView(this.#firstLapRecords()[Gender.male]));
  readonly womenFirstLap = computed(() => toFirstLapView(this.#firstLapRecords()[Gender.female]));

  protected readonly statuses = RecordsStatus;
  protected readonly views = RecordsView;
  protected readonly metrics = SeasonMetric;
  protected readonly genders = Gender;
  protected readonly allYearsValue = ALL_YEARS_VALUE;
  protected readonly allGendersValue = ALL_GENDERS_VALUE;
  protected readonly rowHeightPx = RECORDS_ROW_HEIGHT_PX;
  protected readonly podiumSize = RECORDS_PODIUM_SIZE;

  constructor() {
    // Prerender bakes the calm loading state into static HTML; live data arrives after hydration.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.#load();
    }
  }

  onQueryChange(query: string): void {
    this.query.set(query);
  }

  onYearChange(value: string): void {
    this.year.set(value === ALL_YEARS_VALUE ? null : value);
    this.#ensureSeason();
  }

  onViewChange(view: RecordsViewType): void {
    this.view.set(view);
    this.#ensureSeason();
  }

  onMetricChange(metric: SeasonMetricType): void {
    this.chartMetric.set(metric);
    this.#ensureSeason();
  }

  setGender(gender: GenderType | null): void {
    this.gender.set(gender);
  }

  /** The toggle group carries the "all" sentinel because a toggle value cannot be `null`. */
  onGenderChange(value: GenderType | typeof ALL_GENDERS_VALUE): void {
    this.setGender(value === ALL_GENDERS_VALUE ? null : value);
  }

  onChartQueryChange(query: string): void {
    this.chartQuery.set(query);
  }

  addChartPick(pick: ChartPick): void {
    this.chartPicks.update((picks) => [...picks, pick]);
    this.chartQuery.set('');
  }

  removeChartPick(key: string): void {
    this.chartPicks.update((picks) => picks.filter((pick) => pick.key !== key));
  }

  /** `?view=chart` (the guide's «Гонка за сезон» link) opens the page straight on the chart. */
  #initialView(): RecordsViewType {
    return this.#route.snapshot.queryParamMap.get(RECORDS_VIEW_QUERY_PARAM) === RecordsView.chart ? RecordsView.chart : RecordsView.table;
  }

  /** Chart data loads lazily, once per season and metric; a cached one flips the chart straight to ready. */
  #ensureSeason(): void {
    const year = this.chartYear();

    if (this.view() !== RecordsView.chart || year === null) {
      return;
    }

    if (this.#seasonRuns().has(seasonCacheKey(year, this.chartMetric()))) {
      this.chartStatus.set(RecordsStatus.ready);
    } else {
      void this.#loadSeason(year, this.chartMetric());
    }
  }

  /** The guards keep a slow stale season or metric from overwriting the status of the current one. */
  async #loadSeason(year: string, metric: SeasonMetricType): Promise<void> {
    this.chartStatus.set(RecordsStatus.loading);

    try {
      const seasonRuns =
        metric === SeasonMetric.firstLap ? await this.#athletes.loadSeasonLapRuns(year) : await this.#athletes.loadSeasonRuns(year);

      this.#seasonRuns.update((cache) => new Map(cache).set(seasonCacheKey(year, metric), seasonRuns));

      if (this.chartYear() === year && this.chartMetric() === metric) {
        this.chartStatus.set(RecordsStatus.ready);
      }
    } catch {
      if (this.chartYear() === year && this.chartMetric() === metric) {
        this.chartStatus.set(RecordsStatus.error);
      }
    }
  }

  async #load(): Promise<void> {
    try {
      const [records, courseRecords, firstLapRecords] = await Promise.all([
        this.#athletes.loadRecords(),
        this.#athletes.loadCourseRecords(),
        this.#athletes.loadFirstLapRecords(),
      ]);

      this.#records.set(records);
      this.#courseRecords.set(courseRecords);
      this.#firstLapRecords.set(firstLapRecords);
      this.status.set(records.length === 0 ? RecordsStatus.empty : RecordsStatus.ready);
      // A deep link straight into the chart view needs its season as soon as the years are known.
      this.#ensureSeason();
    } catch {
      this.status.set(RecordsStatus.error);
    }
  }
}

/** One cache slot per season and metric: the 5 km standings and the first-lap ones load separately. */
function seasonCacheKey(year: string, metric: SeasonMetricType): string {
  return `${year}:${metric}`;
}

/** The ranked board for one gender and season, prepared for the template. */
function toBoard(records: AthleteRecord[], gender: GenderType, year: string | null): BestResultView[] {
  const board = bestResults(records, gender, year);
  const crowned = crownedKey(board);

  return board.map((result, index) => toView(result, index, crowned));
}

/**
 * The record belongs to the first athlete to run the board's top time — a later equal run shares
 * the first place (the board tie-breaks by name) but never takes the crown over.
 */
function crownedKey(board: BestResult[]): string | null {
  const [top] = board;

  if (top === undefined) {
    return null;
  }

  return board.filter((row) => row.bestMs === top.bestMs).reduce((earliest, row) => (row.dateIso < earliest.dateIso ? row : earliest)).key;
}

/** Chart search matches season lines of both genders, sorted by name, capped for the dropdown. */
function suggestChartPicks(lines: SeasonPositionLine[], query: string, picks: ChartPick[]): ChartPick[] {
  const normalizedQuery = normalizeAthleteKey(query);

  if (normalizedQuery === '') {
    return [];
  }

  const picked = new Set(picks.map((pick) => pick.key));

  return lines
    .filter((line) => line.key.includes(normalizedQuery) && !picked.has(line.key))
    .sort((left, right) => left.displayName.localeCompare(right.displayName, NAME_COLLATION_LOCALE))
    .slice(0, CHART_SUGGESTION_LIMIT)
    .map((line) => ({ key: line.key, displayName: line.displayName }));
}

/** Name search keeps each row's place from the full board, so a found athlete shows their real rank. */
function searchRows(rows: BestResultView[], query: string): BestResultView[] {
  const normalizedQuery = normalizeAthleteKey(query);

  if (normalizedQuery === '') {
    return rows;
  }

  return rows.filter((row) => row.key.includes(normalizedQuery));
}

function toView(result: BestResult, index: number, crowned: string | null): BestResultView {
  return {
    place: index + 1,
    key: result.key,
    athleteLink: [ATHLETES_PAGE_LINK, result.key],
    displayName: result.displayName,
    timeText: formatDuration(result.bestMs),
    dateShort: formatRussianDateShort(result.dateIso),
    raceLink: [RACE_PAGE_BASE_LINK, result.slug],
    crowned: result.key === crowned,
  };
}

/** The standing first-lap record prepared for the template; null keeps the vacant note. */
function toFirstLapView(record: FirstLapRun | null): FirstLapRecordView | null {
  if (record === null) {
    return null;
  }

  return {
    key: record.key,
    athleteLink: [ATHLETES_PAGE_LINK, record.key],
    displayName: record.displayName,
    timeText: formatDuration(record.lapMs),
    dateShort: formatRussianDateShort(record.dateIso),
    raceLink: [RACE_PAGE_BASE_LINK, record.slug],
  };
}

/** The all-time crown label, or the short prefix with the chosen season («Король 2024»). */
function crownText(allTime: string, yearPrefix: string, year: string | null): string {
  return year === null ? allTime : `${yearPrefix} ${year}`;
}

/** The progression flipped newest-first for the timeline: the current record leads the list. */
function toTimeline(entries: readonly CourseRecordEntry[]): CourseRecordView[] {
  return entries
    .map((entry, index) => ({
      key: entry.key,
      athleteLink: [ATHLETES_PAGE_LINK, entry.key],
      displayName: entry.displayName,
      timeText: formatDuration(entry.timeMs),
      dateShort: formatRussianDateShort(entry.dateIso),
      raceLink: [RACE_PAGE_BASE_LINK, entry.slug],
      improvementText: entry.previousMs === null ? null : RECORD_DELTA_SIGN + formatDuration(entry.previousMs - entry.timeMs),
      current: index === entries.length - 1,
    }))
    .reverse();
}

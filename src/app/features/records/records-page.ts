import { ScrollingModule } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { loadWithTransfer } from '../../core/transfer/transfer-load';

import { ATHLETES_PAGE_LINK } from '../../app.constant';
import { normalizeAthleteKey } from '../../core/history/athlete-key';
import { NAME_COLLATION_LOCALE } from '../../core/history/athletes-list.constant';
import { bestResults, bestResultYears, bestSeasonResults } from '../../core/history/best-results';
import { BestResult } from '../../core/history/best-results.interface';
import { EMPTY_COURSE_RECORD_HISTORY } from '../../core/history/course-records.constant';
import { CourseRecordEntry } from '../../core/history/course-records.interface';
import { CourseRecordHistory } from '../../core/history/course-records.type';
import { EMPTY_FIRST_LAP_RECORDS } from '../../core/history/first-lap.constant';
import { FirstLapRun } from '../../core/history/first-lap.interface';
import { FirstLapRecords } from '../../core/history/first-lap.type';
import { ratingBoard } from '../../core/history/rating-board';
import { newestEventIso, winnerTimesBySlug } from '../../core/history/runner-scores';
import { EventWinnerTimes, RatingRow } from '../../core/history/runner-scores.interface';
import { scoreText } from '../../core/history/score-text';
import { buildSeasonPositions } from '../../core/history/season-positions';
import { SeasonPositionLine, SeasonRun } from '../../core/history/season-positions.interface';
import { SeasonType } from '../../core/history/seasons.enum';
import { weatherExtremes } from '../../core/history/weather-records';
import { EventWeatherRow, WeatherExtreme, WeatherExtremes } from '../../core/history/weather-records.interface';
import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { Gender, GenderType } from '../../core/models/gender.enum';
import { formatDuration } from '../../core/time/duration';
import { formatRussianDateShort } from '../../core/time/russian-date';
import { temperatureText } from '../../core/weather/temperature-text';
import { weatherIconOf } from '../../core/weather/weather-icon';
import { AthletesService } from '../../github/athletes.service';
import { ReloadButton } from '../../shared/reload-button/reload-button';
import { FEMALE_GENDER_TEXT, MALE_GENDER_TEXT, RACE_PAGE_BASE_LINK } from '../race/race-page.constant';
import { ALL_YEARS_VALUE } from '../races/races-page.constant';
import { BumpChart } from './bump-chart/bump-chart';
import {
  ALL_GENDERS_VALUE,
  ALL_SEASONS_VALUE,
  CHART_SUGGESTION_LIMIT,
  KING_ALL_TIME_TEXT,
  KING_YEAR_PREFIX,
  NO_GRADE_TEXT,
  QUEEN_ALL_TIME_TEXT,
  QUEEN_YEAR_PREFIX,
  RECORDS_PODIUM_SIZE,
  RECORDS_ROW_HEIGHT_PX,
  RECORDS_TRANSFER_KEY,
  RECORDS_VIEW_QUERY_PARAM,
  RECORD_DELTA_SIGN,
  SEASON_FILTER_OPTIONS,
  SEASON_GENITIVE_LABELS,
  WEATHER_COLDEST_LABEL,
  WEATHER_HOTTEST_LABEL,
  WEATHER_WINDIEST_LABEL,
  WINDIEST_VALUE_ICON,
} from './records-page.constant';
import { RecordsStatus, RecordsStatusType, RecordsView, RecordsViewType, SeasonMetric, SeasonMetricType } from './records-page.enum';
import {
  BestResultView,
  ChartPick,
  CourseRecordView,
  FirstLapRecordView,
  RatingRowView,
  RecordsData,
  WeatherExtremeView,
} from './records-page.interface';

/**
 * Full 5 km leaderboards with a name search, season and gender filters, and virtual scroll.
 * The current record holder of each board wears the crown badge («Король/Королева трассы», or
 * «Король 2024» in a season view), and the course record progression renders as two timelines.
 * The «Гонка за сезон» view (also reachable via `/records?view=chart`) swaps the boards for the
 * season bump chart: the standings race of the chosen year (the newest one while the year filter
 * says «Все годы»), loaded lazily per season, with its own «find yourself» picker that keeps the
 * chosen athletes' lines lit on both charts. The «Рейтинг» view (`/records?view=rating`) shows the
 * combined М+Ж board of runner scores: who is in form right now, sorted by the weighted top-5 of
 * the last year.
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
  readonly #weatherRows = signal<EventWeatherRow[]>([]);
  readonly #winnerEvents = signal<EventWinnerTimes[]>([]);
  // The lambdas run lazily, so referencing the filter signals declared below is safe.
  readonly #menBoard = computed(() => toBoard(this.#records(), Gender.male, this.year(), this.season()));
  readonly #womenBoard = computed(() => toBoard(this.#records(), Gender.female, this.year(), this.season()));
  /** The combined М+Ж rating board; places are fixed before the search and gender filters cut it. */
  readonly #ratingBoard = computed(() =>
    ratingBoard(this.#records(), winnerTimesBySlug(this.#winnerEvents()), this.#courseRecords(), newestEventIso(this.#winnerEvents())).map(
      toRatingRowView,
    ),
  );

  readonly #seasonRuns = signal<ReadonlyMap<string, SeasonRun[]>>(new Map());
  readonly #chartRuns = computed(() => {
    const year = this.chartYear();

    return year === null ? [] : (this.#seasonRuns().get(seasonCacheKey(year, this.chartMetric())) ?? []);
  });

  readonly #chartLines = computed(() => [...this.menPositions().lines, ...this.womenPositions().lines]);

  readonly status = signal<RecordsStatusType>(RecordsStatus.loading);
  readonly query = signal('');
  readonly year = signal<string | null>(null);
  /** The season cut of the chosen year's boards; always null while the year filter says «Все годы». */
  readonly season = signal<SeasonType | null>(null);
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
  /** The visible rating rows: the search and the gender filter never move the fixed places. */
  readonly ratingRows = computed(() => {
    const gender = this.gender();
    const rows = searchRows(this.#ratingBoard(), this.query());

    return gender === null ? rows : rows.filter((row) => row.gender === gender);
  });

  /** How many athletes the full rating board ranks, ignoring the search and the filters. */
  readonly ratingCount = computed(() => this.#ratingBoard().length);
  /** Board sizes ignore the search box: the badge always shows how many athletes the board ranks. */
  readonly menCount = computed(() => this.#menBoard().length);
  readonly womenCount = computed(() => this.#womenBoard().length);
  readonly showMen = computed(() => this.gender() !== Gender.female);
  readonly showWomen = computed(() => this.gender() !== Gender.male);
  readonly noMatches = computed(() => (!this.showMen() || this.men().length === 0) && (!this.showWomen() || this.women().length === 0));
  readonly kingText = computed(() => crownText(KING_ALL_TIME_TEXT, KING_YEAR_PREFIX, this.year(), this.season()));
  readonly queenText = computed(() => crownText(QUEEN_ALL_TIME_TEXT, QUEEN_YEAR_PREFIX, this.year(), this.season()));
  readonly menRecordTimeline = computed(() => toTimeline(this.#courseRecords()[Gender.male]));
  readonly womenRecordTimeline = computed(() => toTimeline(this.#courseRecords()[Gender.female]));
  readonly menFirstLap = computed(() => toFirstLapView(this.#firstLapRecords()[Gender.male]));
  readonly womenFirstLap = computed(() => toFirstLapView(this.#firstLapRecords()[Gender.female]));
  /** The weather extreme cards of the chosen season (or all time); empty hides the section. */
  readonly weatherViews = computed(() => toWeatherViews(weatherExtremes(this.#weatherRows(), this.year())));

  protected readonly statuses = RecordsStatus;
  protected readonly views = RecordsView;
  protected readonly metrics = SeasonMetric;
  protected readonly genders = Gender;
  protected readonly allYearsValue = ALL_YEARS_VALUE;
  protected readonly allGendersValue = ALL_GENDERS_VALUE;
  protected readonly allSeasonsValue = ALL_SEASONS_VALUE;
  protected readonly seasonOptions = SEASON_FILTER_OPTIONS;
  protected readonly rowHeightPx = RECORDS_ROW_HEIGHT_PX;
  protected readonly podiumSize = RECORDS_PODIUM_SIZE;

  constructor() {
    // Prerender fetches the boards off the on-disk db and bakes them into the static HTML; the
    // browser trusts that value (`trustBaked`) and skips the refetch that used to re-run every
    // aggregate over HTTP range requests. The season bump chart stays lazy — see `#ensureSeason`.
    loadWithTransfer({
      key: RECORDS_TRANSFER_KEY,
      load: () => this.#loadData(),
      apply: (data) => this.#applyData(data),
      onError: () => this.status.set(RecordsStatus.error),
      trustBaked: true,
    });
  }

  onQueryChange(query: string): void {
    this.query.set(query);
  }

  onYearChange(value: string): void {
    this.year.set(value === ALL_YEARS_VALUE ? null : value);

    // The season cut belongs to one year; «Все годы» drops it together with its chips.
    if (value === ALL_YEARS_VALUE) {
      this.season.set(null);
    }

    this.#ensureSeason();
  }

  /** The season chips carry the "all" sentinel, like the gender toggle. */
  onSeasonChange(value: SeasonType | typeof ALL_SEASONS_VALUE): void {
    this.season.set(value === ALL_SEASONS_VALUE ? null : value);
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

  /** `?view=chart` and `?view=rating` (the guide's deep links) open the page straight on that view. */
  #initialView(): RecordsViewType {
    const param = this.#route.snapshot.queryParamMap.get(RECORDS_VIEW_QUERY_PARAM);

    if (param === RecordsView.chart || param === RecordsView.rating) {
      return param;
    }

    return RecordsView.table;
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

  async #loadData(): Promise<RecordsData> {
    const [records, courseRecords, firstLapRecords, weatherRows, winnerEvents] = await Promise.all([
      this.#athletes.loadRecords(),
      this.#athletes.loadCourseRecords(),
      this.#athletes.loadFirstLapRecords(),
      // The weather extremes are garnish: a failed read still renders the boards.
      this.#athletes.loadWeatherRows().catch(() => []),
      this.#athletes.loadEventWinnerTimes(),
    ]);

    return { records, courseRecords, firstLapRecords, weatherRows, winnerEvents };
  }

  #applyData(data: RecordsData): void {
    this.#records.set(data.records);
    this.#courseRecords.set(data.courseRecords);
    this.#firstLapRecords.set(data.firstLapRecords);
    this.#weatherRows.set(data.weatherRows);
    this.#winnerEvents.set(data.winnerEvents);
    this.status.set(data.records.length === 0 ? RecordsStatus.empty : RecordsStatus.ready);
    // A deep link straight into the chart view needs its season as soon as the years are known.
    this.#ensureSeason();
  }
}

/** One cache slot per season and metric: the 5 km standings and the first-lap ones load separately. */
function seasonCacheKey(year: string, metric: SeasonMetricType): string {
  return `${year}:${metric}`;
}

/** The ranked board for one gender and season, prepared for the template. */
function toBoard(records: AthleteRecord[], gender: GenderType, year: string | null, season: SeasonType | null): BestResultView[] {
  const board = year !== null && season !== null ? bestSeasonResults(records, gender, year, season) : bestResults(records, gender, year);
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
function searchRows<T extends { key: string }>(rows: T[], query: string): T[] {
  const normalizedQuery = normalizeAthleteKey(query);

  if (normalizedQuery === '') {
    return rows;
  }

  return rows.filter((row) => row.key.includes(normalizedQuery));
}

/** One rating row for the template; the board arrives sorted, so the index IS the place. */
function toRatingRowView(row: RatingRow, index: number): RatingRowView {
  return {
    place: index + 1,
    key: row.key,
    athleteLink: [ATHLETES_PAGE_LINK, row.key],
    displayName: row.displayName,
    gender: row.gender,
    genderText: row.gender === Gender.male ? MALE_GENDER_TEXT : FEMALE_GENDER_TEXT,
    formText: scoreText(row.formIndex),
    rankText: scoreText(row.runnerRank),
    gradeText: row.localGrade === null ? NO_GRADE_TEXT : scoreText(row.localGrade),
  };
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

/** The extreme cards in display order; a scope without stored wind readings drops the wind card. */
function toWeatherViews(extremes: WeatherExtremes | null): WeatherExtremeView[] {
  if (extremes === null) {
    return [];
  }

  const views = [
    toTemperatureExtremeView(WEATHER_COLDEST_LABEL, extremes.coldest),
    toTemperatureExtremeView(WEATHER_HOTTEST_LABEL, extremes.hottest),
  ];

  if (extremes.windiest !== null) {
    const windKmh = Math.round(extremes.windiest.windKmh);

    views.push({
      label: WEATHER_WINDIEST_LABEL,
      valueText: `${WINDIEST_VALUE_ICON} ` + $localize`:@@records.windValue:${windKmh}:windKmh: км/ч`,
      detailText: temperatureText(extremes.windiest.temperatureC),
      dateShort: formatRussianDateShort(extremes.windiest.slug),
      raceLink: [RACE_PAGE_BASE_LINK, extremes.windiest.slug],
    });
  }

  return views;
}

/** A temperature record card: the day's sky icon with the reading, the wind as the detail line. */
function toTemperatureExtremeView(label: string, extreme: WeatherExtreme): WeatherExtremeView {
  return {
    label,
    valueText: `${weatherIconOf(extreme.weatherCode)} ${temperatureText(extreme.temperatureC)}`.trim(),
    detailText: extreme.windKmh === null ? '' : windText(extreme.windKmh),
    dateShort: formatRussianDateShort(extreme.slug),
    raceLink: [RACE_PAGE_BASE_LINK, extreme.slug],
  };
}

function windText(windKmh: number): string {
  const rounded = Math.round(windKmh);

  return $localize`:@@records.weatherWind:ветер ${rounded}:windKmh: км/ч`;
}

/** The all-time crown label, or the prefix with the chosen cut: «Король 2024», «Король лета 2026». */
function crownText(allTime: string, yearPrefix: string, year: string | null, season: SeasonType | null): string {
  if (year === null) {
    return allTime;
  }

  return season === null ? `${yearPrefix} ${year}` : `${yearPrefix} ${SEASON_GENITIVE_LABELS[season]} ${year}`;
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

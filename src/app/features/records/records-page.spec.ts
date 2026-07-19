import { PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, provideRouter } from '@angular/router';

import { EXPECTED_YEARS, LEADERBOARD_RECORDS, LEADERBOARD_YEAR } from '../../core/history/best-results.mock';
import { EXPECTED_COURSE_RECORD_HISTORY } from '../../core/history/course-records.mock';
import { EMPTY_FIRST_LAP_RECORDS } from '../../core/history/first-lap.constant';
import { EXPECTED_FIRST_LAP_RECORDS } from '../../core/history/first-lap.mock';
import {
  EXPECTED_MEN_LINES,
  EXPECTED_MEN_RANKED_COUNT,
  EXPECTED_WOMEN_POSITIONS,
  SEASON_RUNS,
} from '../../core/history/season-positions.mock';
import { WEATHER_ROWS_MOCK } from '../../core/history/weather-records.mock';
import { Gender } from '../../core/models/gender.enum';
import { AthletesService } from '../../github/athletes.service';
import { ALL_YEARS_VALUE } from '../races/races-page.constant';
import { activatedRouteQueryStub } from '../spec-utils/activated-route-stub';
import { BROWSER_PLATFORM_ID, SERVER_PLATFORM_ID } from '../spec-utils/platform.mock';
import { settle } from '../spec-utils/settle';
import { RecordsPage } from './records-page';
import {
  ALL_GENDERS_VALUE,
  CHART_SUGGESTION_LIMIT,
  KING_ALL_TIME_TEXT,
  KING_YEAR_PREFIX,
  QUEEN_ALL_TIME_TEXT,
  RECORDS_CHART_QUERY_PARAMS,
  RECORDS_RATING_QUERY_PARAMS,
  RECORDS_TRANSFER_KEY,
} from './records-page.constant';
import { RecordsStatus, RecordsView, SeasonMetric } from './records-page.enum';
import { RecordsData } from './records-page.interface';
import {
  BAKED_RECORDS_DATA,
  CHART_FILLER_QUERY,
  CHART_PICK,
  CHART_WOMAN_QUERY,
  EXPECTED_CHART_WOMAN_KEY,
  EXPECTED_LAP_LEADER_KEY,
  EXPECTED_LAP_TAGLINE_FRAGMENT,
  EXPECTED_CROWNED_MEN_KEY,
  EXPECTED_CROWNED_WOMEN_KEY,
  EXPECTED_MEN_FIRST_LAP_VIEW,
  EXPECTED_MEN_NAMES,
  EXPECTED_MEN_TIMELINE_DELTAS,
  EXPECTED_MEN_TIMELINE_TIMES,
  EXPECTED_RATING_ROWS,
  EXPECTED_SEARCH_PLACE,
  EXPECTED_TIE_CROWNED_KEY,
  EXPECTED_TIMELINE_ROW_COUNT,
  EXPECTED_TOP_TIME_TEXT,
  EXPECTED_WEATHER_VIEWS,
  EXPECTED_WINDLESS_WEATHER_VIEWS,
  EXPECTED_WOMEN_FIRST_LAP_VIEW,
  EXPECTED_WOMEN_NAMES,
  EXPECTED_YEAR_RACE_SLUG,
  EXPECTED_2025_COLDEST_VIEW,
  WEATHER_SEASON_YEAR,
  HISTORY_LOAD_ERROR_MESSAGE,
  NO_MATCH_QUERY,
  SEARCH_QUERY,
  METRIC_FIRST_LAP_TEXT,
  RATING_COURSE_RECORDS,
  RATING_WINNER_EVENTS,
  SEASON_ERROR_YEAR,
  SEASON_LAP_RUNS,
  TIE_RECORDS,
  WINDLESS_WEATHER_ROWS,
} from './records-page.mock';

describe('RecordsPage', () => {
  const loadRecords = vi.fn();
  const loadCourseRecords = vi.fn();
  const loadFirstLapRecords = vi.fn();
  const loadSeasonRuns = vi.fn();
  const loadSeasonLapRuns = vi.fn();
  const loadWeatherRows = vi.fn();
  const loadEventWinnerTimes = vi.fn();

  const RECORDS_KEY = makeStateKey<{ data: RecordsData } | null>(RECORDS_TRANSFER_KEY);

  let platformId = BROWSER_PLATFORM_ID;
  let queryParams: Params = {};
  let fixture: ComponentFixture<RecordsPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    platformId = BROWSER_PLATFORM_ID;
    queryParams = {};
    loadRecords.mockResolvedValue(LEADERBOARD_RECORDS);
    loadCourseRecords.mockResolvedValue(EXPECTED_COURSE_RECORD_HISTORY);
    loadFirstLapRecords.mockResolvedValue(EXPECTED_FIRST_LAP_RECORDS);
    loadSeasonRuns.mockResolvedValue([]);
    loadSeasonLapRuns.mockResolvedValue([]);
    loadWeatherRows.mockResolvedValue(WEATHER_ROWS_MOCK);
    loadEventWinnerTimes.mockResolvedValue([]);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AthletesService,
          useValue: {
            loadRecords,
            loadCourseRecords,
            loadFirstLapRecords,
            loadSeasonRuns,
            loadSeasonLapRuns,
            loadWeatherRows,
            loadEventWinnerTimes,
          },
        },
        { provide: PLATFORM_ID, useFactory: () => platformId },
        { provide: ActivatedRoute, useFactory: () => activatedRouteQueryStub(queryParams) },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  async function createPage(): Promise<ComponentFixture<RecordsPage>> {
    const created = TestBed.createComponent(RecordsPage);

    await settle();

    return created;
  }

  it('renders both full leaderboards with places and the participant counters', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(RecordsStatus.ready);
    expect(page.men().map((row) => row.displayName)).toEqual(EXPECTED_MEN_NAMES);
    expect(page.women().map((row) => row.displayName)).toEqual(EXPECTED_WOMEN_NAMES);
    expect(page.men().map((row) => row.place)).toEqual([1, 2, 3]);
    expect(page.men()[0].timeText).toBe(EXPECTED_TOP_TIME_TEXT);
    expect(page.years()).toEqual(EXPECTED_YEARS);
    expect(page.menCount()).toBe(EXPECTED_MEN_NAMES.length);
    expect(page.womenCount()).toBe(EXPECTED_WOMEN_NAMES.length);
    expect(
      page.men().flatMap((row) => (row.crowned ? [row.key] : [])),
      'the 19:00 tie stays with its first setter',
    ).toEqual([EXPECTED_CROWNED_MEN_KEY]);
    expect(page.women().flatMap((row) => (row.crowned ? [row.key] : []))).toEqual([EXPECTED_CROWNED_WOMEN_KEY]);
    expect(page.kingText()).toBe(KING_ALL_TIME_TEXT);
    expect(page.queenText()).toBe(QUEEN_ALL_TIME_TEXT);
    expect(
      page.menRecordTimeline().map((entry) => entry.timeText),
      'the timeline leads with the standing record',
    ).toEqual(EXPECTED_MEN_TIMELINE_TIMES);
    expect(page.menRecordTimeline().map((entry) => entry.improvementText)).toEqual(EXPECTED_MEN_TIMELINE_DELTAS);
    expect(page.menRecordTimeline().map((entry) => entry.current)).toEqual([true, false, false]);
    expect(page.menFirstLap()).toEqual(EXPECTED_MEN_FIRST_LAP_VIEW);
    expect(page.womenFirstLap()).toEqual(EXPECTED_WOMEN_FIRST_LAP_VIEW);
    expect(page.weatherViews()).toEqual(EXPECTED_WEATHER_VIEWS);

    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(
      element.querySelectorAll('.records__board').length,
      'two leaderboards, two timelines, two first-lap cards and three weather cards',
    ).toBe(9);
    expect(element.querySelector('.records__history')).not.toBeNull();
    expect(element.querySelectorAll('.records__timeline-row').length).toBe(EXPECTED_TIMELINE_ROW_COUNT);
    expect(element.querySelectorAll('.records__timeline-row_current').length, 'one standing record per gender').toBe(2);
    expect(element.querySelectorAll('.records__lap').length, 'one standing first-lap record per gender').toBe(2);
    expect(element.querySelector('.records__board-count').textContent).toContain(`${EXPECTED_MEN_NAMES.length}`);
    expect(element.querySelector('.records__viewport'), 'the board list virtualizes through the window scroll').not.toBeNull();
    expect(element.querySelector('.records__search-input')).not.toBeNull();
    expect(element.querySelector('.records__status').textContent.trim(), 'the live region is empty once ready').toBe('');
  });

  it('search keeps the real place, and an unmatched query reports no matches', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    page.onQueryChange(SEARCH_QUERY);

    expect(page.men().map((row) => row.place)).toEqual([EXPECTED_SEARCH_PLACE]);
    expect(page.women()).toEqual([]);
    expect(page.menCount(), 'the participant counter ignores the search box').toBe(EXPECTED_MEN_NAMES.length);
    expect(page.noMatches(), 'one non-empty board is still a match').toBe(false);

    page.onQueryChange(NO_MATCH_QUERY);

    expect(page.noMatches()).toBe(true);

    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('.records__board').length,
      'leaderboards hide behind the no-matches message; the record timelines, first-lap and weather cards stay',
    ).toBe(7);
  });

  it('filters by season and by gender', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    page.onYearChange(LEADERBOARD_YEAR);

    expect(page.men().map((row) => row.place)).toEqual([1]);
    expect(page.men()[0].raceLink.at(-1), 'the record run comes from the chosen season').toBe(EXPECTED_YEAR_RACE_SLUG);
    expect(page.men()[0].crowned, 'the sole 2024 runner is the season king').toBe(true);
    expect(page.kingText()).toBe(`${KING_YEAR_PREFIX} ${LEADERBOARD_YEAR}`);
    expect(page.women()).toEqual([]);

    page.onYearChange(ALL_YEARS_VALUE);

    expect(page.men().length).toBe(EXPECTED_MEN_NAMES.length);
    expect(page.kingText(), 'the crown label follows the season filter back').toBe(KING_ALL_TIME_TEXT);

    page.onGenderChange(Gender.male);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('.records__board').length,
      'one leaderboard, one timeline, one first-lap card — the genderless weather cards stay',
    ).toBe(6);

    page.setGender(Gender.female);
    page.onQueryChange(NO_MATCH_QUERY);

    expect(page.showMen()).toBe(false);
    expect(page.noMatches(), 'a hidden board never counts as a match').toBe(true);

    page.onQueryChange(SEARCH_QUERY);

    expect(page.noMatches(), 'Быстров is male, so the female board stays empty').toBe(true);

    page.onGenderChange(ALL_GENDERS_VALUE);

    expect(page.noMatches()).toBe(false);
    expect(page.gender(), 'the "all" toggle maps the sentinel back to null').toBeNull();

    page.onYearChange(WEATHER_SEASON_YEAR);

    expect(page.weatherViews()[0], 'the weather extremes follow the season filter').toEqual(EXPECTED_2025_COLDEST_VIEW);
    expect(page.weatherViews().length, 'the 2025 hottest day stores wind, so the wind card stays').toBe(3);
  });

  it('drops the wind card when no scoped event stored wind', async () => {
    loadWeatherRows.mockResolvedValue(WINDLESS_WEATHER_ROWS);
    fixture = await createPage();

    expect(fixture.componentInstance.weatherViews(), 'temperatures without any wind reading — cold and hot only').toEqual(
      EXPECTED_WINDLESS_WEATHER_VIEWS,
    );
  });

  it('shows the empty state without history and the error state on a load failure', async () => {
    loadRecords.mockResolvedValue([]);
    loadFirstLapRecords.mockResolvedValue(EMPTY_FIRST_LAP_RECORDS);
    loadWeatherRows.mockRejectedValue(new Error(HISTORY_LOAD_ERROR_MESSAGE));
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(RecordsStatus.empty);
    expect(page.menFirstLap(), 'no recorded splits keep the first-lap board vacant').toBeNull();
    expect(page.menPositions().lines, 'no seasons at all — the chart has nothing to rank').toEqual([]);
    expect(page.weatherViews(), 'the failed weather read is garnish — no extreme cards, no error').toEqual([]);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.records__status').textContent.trim()).not.toBe('');

    loadRecords.mockRejectedValue(new Error(HISTORY_LOAD_ERROR_MESSAGE));
    fixture.destroy();
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(RecordsStatus.error);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.records__error').getAttribute('role')).toBe('alert');
  });

  it('crowns the earliest runner of a three-way tie regardless of the alphabetic board order', async () => {
    loadRecords.mockResolvedValue(TIE_RECORDS);
    fixture = await createPage();

    expect(fixture.componentInstance.men().flatMap((row) => (row.crowned ? [row.key] : []))).toEqual([EXPECTED_TIE_CROWNED_KEY]);
  });

  it('opens the combined rating from the ?view=rating deep link, keeping places under the search and gender filters', async () => {
    queryParams = RECORDS_RATING_QUERY_PARAMS;
    loadEventWinnerTimes.mockResolvedValue(RATING_WINNER_EVENTS);
    // The vacant women's board makes Ланская's grade a dash — the null-grade cell of the row.
    loadCourseRecords.mockResolvedValue(RATING_COURSE_RECORDS);
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.view()).toBe(RecordsView.rating);
    expect(page.ratingRows(), 'the mixed М+Ж board sorts by form index, rank, then name').toEqual(EXPECTED_RATING_ROWS);
    expect(page.ratingCount()).toBe(EXPECTED_RATING_ROWS.length);

    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelectorAll('.records__rating-row').length, 'four athletes plus the header row').toBe(
      EXPECTED_RATING_ROWS.length + 1,
    );
    expect(element.querySelector('#records-search'), 'the rating shares the table name search').not.toBeNull();
    expect(element.querySelector('.records__seg[aria-label="Год"]'), 'the form year is fixed — no season filter').toBeNull();

    page.setGender(Gender.female);

    expect(
      page.ratingRows().map((row) => [row.displayName, row.place]),
      'the gender cut keeps the combined places',
    ).toEqual([['Ланская Лидия', 2]]);

    page.setGender(null);
    page.onQueryChange(SEARCH_QUERY);

    expect(
      page.ratingRows().map((row) => row.place),
      'the search keeps the combined place too',
    ).toEqual([1]);
    expect(page.ratingCount(), 'the counter ignores the search box').toBe(EXPECTED_RATING_ROWS.length);
  });

  it('chart view loads seasons lazily with a cache, hides the search, and a failed season shows the chart error', async () => {
    loadSeasonRuns.mockResolvedValueOnce(SEASON_RUNS);
    fixture = await createPage();

    const page = fixture.componentInstance;

    page.onViewChange(RecordsView.chart);
    await settle();

    expect(loadSeasonRuns, 'the default chart season is the newest year').toHaveBeenCalledWith(EXPECTED_YEARS[0]);
    expect(page.chartStatus()).toBe(RecordsStatus.ready);
    expect(page.chartYear()).toBe(EXPECTED_YEARS[0]);
    expect(page.yearSegValue(), 'the chart view highlights its season instead of «Все годы»').toBe(EXPECTED_YEARS[0]);
    expect(page.menPositions().lines).toEqual(EXPECTED_MEN_LINES);
    expect(page.menPositions().rankedCount).toBe(EXPECTED_MEN_RANKED_COUNT);
    expect(page.womenPositions()).toEqual(EXPECTED_WOMEN_POSITIONS);

    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelector('#records-search'), 'the table name search yields to the chart picker').toBeNull();
    expect(element.querySelector('#records-chart-search'), 'the chart brings its own «find yourself» search').not.toBeNull();
    expect(element.querySelectorAll('app-bump-chart').length, 'one chart per gender').toBe(2);
    expect(element.querySelector('.records__history'), 'the record timelines belong to the table view').toBeNull();

    page.onYearChange(LEADERBOARD_YEAR);
    await settle();
    fixture.detectChanges();

    expect(loadSeasonRuns).toHaveBeenCalledWith(LEADERBOARD_YEAR);
    expect(page.menPositions().lines, 'the older season resolves no runs in the mock').toEqual([]);
    expect(element.querySelectorAll('app-bump-chart').length, 'empty seasons fall back to the boards note').toBe(0);

    page.onYearChange(EXPECTED_YEARS[0]);
    await settle();

    expect(loadSeasonRuns.mock.calls.length, 'a season loads once — the cache serves the way back').toBe(2);
    expect(page.chartStatus()).toBe(RecordsStatus.ready);

    loadSeasonRuns.mockRejectedValueOnce(new Error(HISTORY_LOAD_ERROR_MESSAGE));
    page.onYearChange(SEASON_ERROR_YEAR);
    await settle();

    expect(page.chartStatus()).toBe(RecordsStatus.error);
    expect(page.menPositions().lines, 'a failed season stays out of the cache and ranks nothing').toEqual([]);

    page.onViewChange(RecordsView.table);
    fixture.detectChanges();

    expect(page.yearSegValue(), 'the table view highlights the chosen year again').toBe(SEASON_ERROR_YEAR);
    expect(element.querySelector('#records-search'), 'the search returns with the table').not.toBeNull();
  });

  it('switches the chart to the first-lap standings and caches each metric separately', async () => {
    loadSeasonRuns.mockResolvedValueOnce(SEASON_RUNS);
    loadSeasonLapRuns.mockResolvedValueOnce(SEASON_LAP_RUNS);
    fixture = await createPage();

    const page = fixture.componentInstance;
    const element = fixture.nativeElement;
    const lapOption = (): Element | undefined =>
      [...element.querySelectorAll('.records__seg-option')].find((button: Element) => button.textContent?.trim() === METRIC_FIRST_LAP_TEXT);

    fixture.detectChanges();

    expect(lapOption(), 'the metric toggle belongs to the chart view only').toBeUndefined();

    page.onViewChange(RecordsView.chart);
    await settle();
    fixture.detectChanges();

    expect(lapOption()).not.toBeUndefined();
    expect(loadSeasonLapRuns, 'the 5 km mode never touches the lap read').not.toHaveBeenCalled();

    page.onMetricChange(SeasonMetric.firstLap);
    await settle();
    fixture.detectChanges();

    expect(loadSeasonLapRuns).toHaveBeenCalledExactlyOnceWith(EXPECTED_YEARS[0]);
    expect(page.chartStatus()).toBe(RecordsStatus.ready);
    expect(page.menPositions().lines.map((line) => line.key)).toEqual([EXPECTED_LAP_LEADER_KEY]);
    expect(element.querySelector('.records__history-tagline').textContent).toContain(EXPECTED_LAP_TAGLINE_FRAGMENT);

    page.onMetricChange(SeasonMetric.fiveKm);
    await settle();

    expect(loadSeasonRuns.mock.calls.length, 'the 5 km season comes back from the cache').toBe(1);
    expect(page.chartStatus()).toBe(RecordsStatus.ready);
    expect(page.menPositions().lines).toEqual(EXPECTED_MEN_LINES);

    let resolveStale: (runs: typeof SEASON_LAP_RUNS) => void = () => undefined;
    let rejectStale: (error: Error) => void = () => undefined;

    loadSeasonLapRuns.mockImplementationOnce(() => new Promise((resolve) => (resolveStale = resolve)));
    page.onMetricChange(SeasonMetric.firstLap);
    page.onYearChange(LEADERBOARD_YEAR);
    page.onMetricChange(SeasonMetric.fiveKm);
    await settle();
    resolveStale(SEASON_LAP_RUNS);
    await settle();

    expect(page.chartStatus(), 'a stale lap season resolving late never overwrites the current status').toBe(RecordsStatus.ready);

    loadSeasonLapRuns.mockImplementationOnce(() => new Promise((_, reject) => (rejectStale = reject)));
    page.onMetricChange(SeasonMetric.firstLap);
    page.onYearChange(SEASON_ERROR_YEAR);
    page.onMetricChange(SeasonMetric.fiveKm);
    await settle();
    rejectStale(new Error(HISTORY_LOAD_ERROR_MESSAGE));
    await settle();

    expect(page.chartStatus(), 'a stale lap failure never flips the current season into the error state').toBe(RecordsStatus.ready);
  });

  it('opens straight on the chart from the ?view=chart deep link and loads its season', async () => {
    queryParams = RECORDS_CHART_QUERY_PARAMS;
    loadSeasonRuns.mockResolvedValueOnce(SEASON_RUNS);
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.view()).toBe(RecordsView.chart);
    expect(loadSeasonRuns, 'the deep link loads the newest season as soon as the years are known').toHaveBeenCalledWith(EXPECTED_YEARS[0]);
    expect(page.chartStatus()).toBe(RecordsStatus.ready);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('app-bump-chart').length).toBe(2);
  });

  it('chart search suggests season athletes of both genders and turns picks into highlighted keys', async () => {
    queryParams = RECORDS_CHART_QUERY_PARAMS;
    loadSeasonRuns.mockResolvedValueOnce(SEASON_RUNS);
    fixture = await createPage();

    const page = fixture.componentInstance;

    page.onChartQueryChange(CHART_FILLER_QUERY);

    expect(page.chartSuggestions().length, 'eleven fillers match, the dropdown caps them').toBe(CHART_SUGGESTION_LIMIT);

    page.onChartQueryChange(CHART_WOMAN_QUERY);

    expect(
      page.chartSuggestions().map((pick) => pick.key),
      'the picker searches the women’s chart too',
    ).toEqual([EXPECTED_CHART_WOMAN_KEY]);

    page.addChartPick(CHART_PICK);

    expect(page.highlightedKeys()).toEqual([CHART_PICK.key]);
    expect(page.chartQuery(), 'a pick clears the query for the next name').toBe('');

    page.onChartQueryChange(CHART_PICK.displayName);

    expect(page.chartSuggestions(), 'an already picked athlete never re-suggests').toEqual([]);

    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelectorAll('.records__chip').length).toBe(1);
    expect(element.querySelector('.records__chip')?.textContent).toContain(CHART_PICK.displayName);

    page.removeChartPick(CHART_PICK.key);
    fixture.detectChanges();

    expect(page.highlightedKeys()).toEqual([]);
    expect(element.querySelector('.records__chip'), 'removing the last chip hides the list').toBeNull();
  });

  it('prerender fetches the boards and bakes them into the transfer state', async () => {
    platformId = SERVER_PLATFORM_ID;
    fixture = await createPage();

    expect(loadRecords, 'the boards are fetched off the on-disk db during prerender').toHaveBeenCalled();
    expect(fixture.componentInstance.status()).toBe(RecordsStatus.ready);
    expect(TestBed.inject(TransferState).get(RECORDS_KEY, null), 'the boards travel to the browser in the ng-state script').not.toBeNull();
  });

  it('trusts the baked boards and skips the redundant refetch', async () => {
    TestBed.inject(TransferState).set(RECORDS_KEY, { data: BAKED_RECORDS_DATA });
    fixture = await createPage();

    expect(fixture.componentInstance.status(), 'the baked boards render without a network read').toBe(RecordsStatus.ready);
    expect(
      fixture.componentInstance.men().map((row) => row.displayName),
      'the baked records feed the men board',
    ).toEqual(EXPECTED_MEN_NAMES);
    expect(loadRecords, 'trustBaked forgoes the aggregate range requests the refetch would make').not.toHaveBeenCalled();
  });
});

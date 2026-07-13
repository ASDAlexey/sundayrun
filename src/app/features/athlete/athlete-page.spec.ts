import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, provideRouter } from '@angular/router';

import { RunsSort } from '../../core/history/athlete-runs.enum';
import { EXPECTED_ROLLUP_HISTORY, DNF_ONLY_KEY, REPEAT_RUNNER_KEY } from '../../core/history/athletes-rollup.mock';
import { EMPTY_YEAR_ACTIVITY } from '../../core/history/year-badges.mock';
import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { AthletesService } from '../../github/athletes.service';
import { ATHLETES_PAGE_LINK, VERSUS_PAGE_LINK } from '../../app.constant';
import { ALL_YEARS_VALUE } from '../races/races-page.constant';
import { ActivatedRouteStub, activatedRouteStub } from '../spec-utils/activated-route-stub';
import { polyfillDialogModal } from '../spec-utils/dialog-polyfill';
import { settle } from '../spec-utils/settle';
import { AthletePage } from './athlete-page';
import { KEY_ROUTE_PARAM, NO_BEST_TIME_TEXT } from './athlete-page.constant';
import { AthleteStatus } from './athlete-page.enum';
import {
  ATHLETE_BEST_FIRST_LAP,
  ATHLETE_COURSE_RECORDS,
  ATHLETE_LOAD_ERROR_MESSAGE,
  ATHLETE_RIVAL_RUNS,
  ATHLETE_WINNER_EVENTS,
  ATHLETE_YEAR_BESTS,
  ATHLETE_YEAR_FILTER,
  DENORMALIZED_KEY_PARAM,
  EMPTY_LEGEND_VIEW,
  EMPTY_PLACEMENTS_VIEW,
  EMPTY_STREAKS_VIEW,
  EVENT_SLUG_CHRONOLOGY,
  EXPECTED_PLACEMENTS_VIEW,
  EXPECTED_BEST_TIME_TEXT,
  EXPECTED_EMPTY_FINALS_ATTENDANCE_TEXT,
  EXPECTED_FINALS_ATTENDANCE_TEXT,
  EXPECTED_BY_DATE_VIEWS,
  EXPECTED_BY_TIME_VIEWS,
  EXPECTED_CHASER_LEGEND_VIEW,
  EXPECTED_DNF_STREAKS_VIEW,
  EXPECTED_FIRST_LAP_VIEW,
  EXPECTED_LEGEND_VIEW,
  EXPECTED_MEME_ROWS,
  EXPECTED_RANK_YEAR_BADGES,
  EXPECTED_RIVAL_VIEWS,
  EXPECTED_RUN_YEAR_OPTIONS,
  EXPECTED_SEASON_RIVAL_VIEWS,
  EXPECTED_SHORT_RUNNER_VIEWS,
  EXPECTED_STREAKS_VIEW,
  EXPECTED_YEAR_BEST_VIEWS,
  EXPECTED_YEAR_FILTERED_VIEWS,
  LEGEND_FINISHES,
  PLACEMENTS_EVENT_CHRONOLOGY,
  PLACEMENTS_RECORD,
  PLACEMENTS_RUN_PLACES,
  RIVAL_SEASON_FILTER,
  SHORT_RUNNER_KEY_PARAM,
  STUB_BADGE_RARITY,
  STUB_RUN_PLACES,
  UNKNOWN_KEY_PARAM,
} from './athlete-page.mock';

// jsdom has no canvas context, so the embedded progress chart's lazy chart.js import mocks away.
// Shares one Chart object with every chart-rendering spec — see `chart-js.mock.ts`.
vi.mock('chart.js', async () => (await import('./chart-js.mock')).chartJsMock);

vi.mock('chartjs-plugin-zoom', () => ({ default: {} }));

polyfillDialogModal();

describe('AthletePage', () => {
  const loadRecord = vi.fn();
  const loadFirstEventDateByYear = vi.fn(() => Promise.resolve<Record<string, string>>({}));
  const loadEventSlugs = vi.fn(() => Promise.resolve([...EVENT_SLUG_CHRONOLOGY]));
  const loadYearBadgeRarity = vi.fn(() => Promise.resolve(STUB_BADGE_RARITY));
  const loadLegendFinishes = vi.fn(() => Promise.resolve([...LEGEND_FINISHES]));
  const loadRunPlaces = vi.fn((key: string) => Promise.resolve(key === REPEAT_RUNNER_KEY ? STUB_RUN_PLACES : {}));
  const loadRivalRuns = vi.fn(() => Promise.resolve([...ATHLETE_RIVAL_RUNS]));
  const loadBestFirstLap = vi.fn((key: string) => Promise.resolve(key === REPEAT_RUNNER_KEY ? ATHLETE_BEST_FIRST_LAP : null));
  const loadYearBests = vi.fn(() => Promise.resolve([...ATHLETE_YEAR_BESTS]));
  const loadCourseRecords = vi.fn(() => Promise.resolve(ATHLETE_COURSE_RECORDS));
  const loadEventWinnerTimes = vi.fn(() => Promise.resolve([...ATHLETE_WINNER_EVENTS]));
  // The weather-card scan is covered by its own spec; an empty read keeps the card out of the page here.
  const loadWeatherRows = vi.fn(() => Promise.resolve([]));
  const routeParams: Params = {};

  let routeStub: ActivatedRouteStub;
  let fixture: ComponentFixture<AthletePage>;

  beforeEach(() => {
    vi.clearAllMocks();
    routeParams[KEY_ROUTE_PARAM] = DENORMALIZED_KEY_PARAM;
    loadRecord.mockImplementation((key: string) => Promise.resolve(EXPECTED_ROLLUP_HISTORY[key] ?? null));
    routeStub = activatedRouteStub(routeParams);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AthletesService,
          useValue: {
            loadRecord,
            loadFirstEventDateByYear,
            loadEventSlugs,
            loadYearBadgeRarity,
            loadLegendFinishes,
            loadRunPlaces,
            loadRivalRuns,
            loadBestFirstLap,
            loadYearBests,
            loadCourseRecords,
            loadEventWinnerTimes,
            loadWeatherRows,
          },
        },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  async function createPage(): Promise<ComponentFixture<AthletePage>> {
    const created = TestBed.createComponent(AthletePage);

    await settle();

    return created;
  }

  it('normalizes the route key and renders the header, records and the runs table (fastest first)', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;
    const expectedRecord = EXPECTED_ROLLUP_HISTORY[REPEAT_RUNNER_KEY];

    expect(page.status()).toBe(AthleteStatus.ready);
    expect(page.displayName()).toBe(expectedRecord.displayName);
    expect(page.participationCount()).toBe(expectedRecord.participationSlugs.length);
    expect(page.finishCount()).toBe(expectedRecord.runs.length);
    expect(page.finalsAttendanceText(), 'no finals in the archive — the stat is hidden').toBeNull();
    expect(page.progressRuns(), 'the sparkline receives the unfiltered 5 km history').toEqual(expectedRecord.runs);
    expect(page.allRuns(), 'the lifetime card receives every finish of both distances').toEqual(expectedRecord.runs);
    expect(page.bestTimeText()).toBe(EXPECTED_BEST_TIME_TEXT);
    expect(page.firstLap(), 'the best recorded split links to its protocol').toEqual(EXPECTED_FIRST_LAP_VIEW);
    expect(page.yearBests()).toEqual(EXPECTED_YEAR_BEST_VIEWS);
    expect(page.years()).toEqual(EXPECTED_RUN_YEAR_OPTIONS);
    expect(page.runs(), 'runs are sorted by time by default').toEqual(EXPECTED_BY_TIME_VIEWS);
    expect(page.streaks(), 'all three races form one running streak').toEqual(EXPECTED_STREAKS_VIEW);
    expect(page.badgeRarity(), 'the chips receive the loaded rarity shares').toEqual(STUB_BADGE_RARITY);
    expect(page.yearBadges(), 'the course crown and the year crown lead the 2026 row').toEqual(EXPECTED_RANK_YEAR_BADGES);
    expect(page.gender(), 'the chips receive the athlete’s gender for the crown labels').toBe(expectedRecord.gender);
    expect(page.legend(), 'three windowed finishes keep the crown here').toEqual(EXPECTED_LEGEND_VIEW);
    expect(page.rivals(), 'the close finishers rank by the count; the lone one stays out').toEqual(EXPECTED_RIVAL_VIEWS);
    expect(page.memes(), 'the 24:00 best slots in under Киптум’s pace with the celebrities beaten').toEqual(EXPECTED_MEME_ROWS);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const headers = [...element.querySelectorAll('.athlete__th')];
    const raceLinks = [...element.querySelectorAll('.athlete__race')];
    const filterChips = [...element.querySelectorAll('.athlete__filter')[0].querySelectorAll('.athlete__chip')];

    expect(element.querySelector('.athlete__status').getAttribute('aria-live'), 'the live region stays in the DOM across states').toBe(
      'polite',
    );
    expect(element.querySelector('.athlete__status').textContent.trim(), 'the live region is empty once the history is ready').toBe('');
    expect(element.querySelector('.athlete__title').textContent.trim()).toBe(expectedRecord.displayName);
    expect(
      headers.map((header) => header.getAttribute('scope')),
      'the table has date, time and place columns',
    ).toEqual(['col', 'col', 'col']);
    expect(raceLinks.map((link) => link.textContent.trim())).toEqual(EXPECTED_BY_TIME_VIEWS.map((view) => view.dateShort));
    expect(
      [...element.querySelectorAll('.athlete__place')].map((cell) => cell.textContent.trim()),
      'the place column shows the stored gender places and dashes the rest',
    ).toEqual(EXPECTED_BY_TIME_VIEWS.map((view) => view.placeText));
    expect(raceLinks[0].getAttribute('href'), 'the date links to the online protocol').toBe(EXPECTED_BY_TIME_VIEWS[0].raceLink.join('/'));
    expect(
      filterChips.map((chip) => chip.textContent.trim()),
      'the year row is the "all" chip plus one per distinct year',
    ).toEqual(['Все', ...EXPECTED_RUN_YEAR_OPTIONS]);
    expect(
      filterChips.map((chip) => chip.classList.contains('mat-button-toggle-checked')),
      'all years by default',
    ).toEqual([true, false, false]);
    const catalogDialog = element.querySelector('.badge-catalog');

    expect(catalogDialog.open, 'the badge catalog waits closed').toBe(false);

    element.querySelector('.athlete__badges-all').click();

    expect(catalogDialog.open, 'the «Все награды» button opens the catalog').toBe(true);

    catalogDialog.close();

    expect(element.querySelector('.athlete__legend-crown'), 'the holder sees the crown line').not.toBeNull();
    expect(element.querySelector('.athlete__legend-bar'), 'the holder needs no progress bar').toBeNull();
    expect([...element.querySelectorAll('.athlete__rival-name')].map((link) => link.textContent.trim())).toEqual(
      EXPECTED_RIVAL_VIEWS.map((view) => view.displayName),
    );
    expect(
      [...element.querySelectorAll('.athlete__rival-score')].map((chip) => chip.textContent.trim()),
      'the score reads the athlete’s wins first',
    ).toEqual(EXPECTED_RIVAL_VIEWS.map((view) => `счёт ${view.score}`));
    expect([...element.querySelectorAll('.athlete__meme')].length, 'the ladder renders every benchmark plus the own rung').toBe(
      EXPECTED_MEME_ROWS.length,
    );
    expect(element.querySelector('.athlete__meme_self').textContent, 'the own rung carries the name and the best').toContain(
      expectedRecord.displayName,
    );
    expect([...element.querySelectorAll('.athlete__meme-mark')].length, 'a check mark per beaten benchmark').toBe(
      EXPECTED_MEME_ROWS.filter((row) => row.isBeaten).length,
    );
    expect(element.querySelector('.athlete__meme-gap').textContent, 'the next target shows the remaining gap').toContain('9:43');
  });

  it('filters by year, re-sorts by date and reports when no runs match', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    page.setSort(RunsSort.byDate);

    expect(page.runs()).toEqual(EXPECTED_BY_DATE_VIEWS);

    page.onYearChange(ATHLETE_YEAR_FILTER);

    expect(page.runs()).toEqual(EXPECTED_YEAR_FILTERED_VIEWS);
    expect(page.rivals(), 'the runs year filter no longer touches the rivals list').toEqual(EXPECTED_RIVAL_VIEWS);

    page.onRivalsYearChange(ATHLETE_YEAR_FILTER);

    expect(page.rivals(), 'one close finish that season — the list empties').toEqual([]);
    expect(page.hasRivals(), 'the all-time rivals keep the card with its chips on screen').toBe(true);

    page.onRivalsYearChange(RIVAL_SEASON_FILTER);

    expect(page.rivals(), 'the season rescan breaks the tie by the smaller gap total').toEqual(EXPECTED_SEASON_RIVAL_VIEWS);

    page.onRivalsYearChange(ALL_YEARS_VALUE);

    expect(page.rivals(), 'the "all years" chip restores the all-time list').toEqual(EXPECTED_RIVAL_VIEWS);
    expect(page.rivalsYear(), 'the "all" toggle maps the sentinel back to null').toBeNull();

    page.onYearChange(ALL_YEARS_VALUE);

    expect(page.runs(), 'the "all years" chip resets the filter').toEqual(EXPECTED_BY_DATE_VIEWS);
    expect(page.year(), 'the "all" toggle maps the sentinel back to null').toBeNull();

    page.setYear(UNKNOWN_KEY_PARAM);
    page.onRivalsYearChange(UNKNOWN_KEY_PARAM);

    expect(page.runs(), 'a year without runs empties the table').toEqual([]);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const sortChips = [...element.querySelectorAll('.athlete__filter')[1].querySelectorAll('.athlete__chip')];
    const rivalsChips = [...element.querySelectorAll('.athlete__rivals-years .athlete__chip')];
    const statusRegions = [...element.querySelectorAll('.athlete__status')];

    expect(element.querySelector('.athlete__table-wrap')).toBeNull();
    expect(
      rivalsChips.map((chip) => chip.textContent.trim()),
      'the rivals card carries its own "all years" chip plus one per run year',
    ).toEqual(['Все годы', ...EXPECTED_RUN_YEAR_OPTIONS]);
    expect(element.querySelector('.athlete__rivals-list'), 'no close finishes that season — the list gives way').toBeNull();
    expect(element.querySelector('.athlete__rivals-empty'), 'the dry season shows the empty note instead').not.toBeNull();
    expect(statusRegions.at(-1).getAttribute('role')).toBe('status');
    expect(statusRegions.at(-1).textContent.trim(), 'the "no filtered runs" note lives in the persistent live region').not.toBe('');
    expect(
      sortChips.map((chip) => chip.classList.contains('mat-button-toggle-checked')),
      'time first, date second',
    ).toEqual([false, true]);
  });

  it('hides 2.3 km runs everywhere: table, finish counter and year chips', async () => {
    routeParams[KEY_ROUTE_PARAM] = SHORT_RUNNER_KEY_PARAM;
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.runs()).toEqual(EXPECTED_SHORT_RUNNER_VIEWS);
    expect(page.finishCount(), 'only the 5 km finish counts').toBe(EXPECTED_SHORT_RUNNER_VIEWS.length);
    expect(page.years(), 'the 2.3 km run year never becomes a chip').toEqual(['2026']);
    expect(page.legend(), 'the chaser sees the holder and «до короны — 2 финиша»').toEqual(EXPECTED_CHASER_LEGEND_VIEW);

    fixture.detectChanges();

    const element = fixture.nativeElement;

    expect(element.querySelector('.athlete__legend-crown'), 'no crown line for the chaser').toBeNull();
    expect(element.querySelector('.athlete__legend-holder').textContent, 'the holder is named').toContain(
      EXPECTED_CHASER_LEGEND_VIEW.legendName,
    );
    expect(element.querySelector('.athlete__legend-bar'), 'the chaser gets the progress bar').not.toBeNull();
  });

  it('splits the best places by race kind and renders the finals card with podium chips', async () => {
    loadRecord.mockResolvedValueOnce({ ...PLACEMENTS_RECORD });
    loadEventSlugs.mockResolvedValueOnce([...PLACEMENTS_EVENT_CHRONOLOGY]);
    loadRunPlaces.mockResolvedValueOnce({ ...PLACEMENTS_RUN_PLACES });
    fixture = await createPage();

    expect(fixture.componentInstance.placements()).toEqual(EXPECTED_PLACEMENTS_VIEW);
    expect(fixture.componentInstance.finalsAttendanceText(), 'the regular race participation stays out of the finals tally').toBe(
      EXPECTED_FINALS_ATTENDANCE_TEXT,
    );

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const chips = [...element.querySelectorAll('.athlete__finals-chip')];

    expect(element.querySelector('.athlete__finals-title'), 'places are known — the finals card is shown').not.toBeNull();
    expect(chips.map((chip) => chip.textContent.trim())).toEqual(EXPECTED_PLACEMENTS_VIEW.podiumTexts);

    routeStub.setParams({ [KEY_ROUTE_PARAM]: UNKNOWN_KEY_PARAM });

    expect(
      fixture.componentInstance.finalsAttendanceText(),
      'while the next load runs, the record is gone but the finals chronology still stands',
    ).toBe(EXPECTED_EMPTY_FINALS_ATTENDANCE_TEXT);

    await settle();
  });

  it('shows the DNF-only athlete without records or a runs table', async () => {
    routeParams[KEY_ROUTE_PARAM] = DNF_ONLY_KEY;
    loadLegendFinishes.mockResolvedValueOnce([]);
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(AthleteStatus.ready);
    expect(page.finishCount()).toBe(0);
    expect(page.bestTimeText()).toBe(NO_BEST_TIME_TEXT);
    expect(page.firstLap(), 'no recorded split hides the first-lap value').toBeNull();
    expect(page.yearBests()).toEqual([]);
    expect(page.streaks(), 'a DNF still counted as showing up, the later misses ended the streak').toEqual(EXPECTED_DNF_STREAKS_VIEW);
    expect(page.legend(), 'an empty board keeps the title vacant').toEqual(EMPTY_LEGEND_VIEW);
    expect(page.placements(), 'a DNF carries no place').toEqual(EMPTY_PLACEMENTS_VIEW);
    expect(page.rivals(), 'no own 5 km finishes — nobody to be close to').toEqual([]);
    expect(page.memes(), 'no best time — no meme ladder').toEqual([]);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const statusRegions = [...element.querySelectorAll('.athlete__status')];

    expect(element.querySelector('.athlete__finals'), 'no known places — no finals card').toBeNull();
    expect(element.querySelector('.athlete__memes'), 'no best time hides the meme card').toBeNull();

    expect(element.querySelector('.athlete__legend-holder').textContent, 'the vacant title is announced').not.toBe('');

    expect(statusRegions.at(-1).getAttribute('aria-live'), 'the "no finishes" note is announced').toBe('polite');
    expect(statusRegions.at(-1).textContent.trim()).not.toBe('');
    expect(element.querySelector('.athlete__table-wrap')).toBeNull();
    expect(element.querySelector('.athlete__controls')).toBeNull();
  });

  it('reloads on a same-route key change, resetting the filters, and drops a stale response', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    page.setYear(ATHLETE_YEAR_FILTER);
    page.setSort(RunsSort.byDate);

    let resolveStale: (record: AthleteRecord | null) => void = vi.fn();

    loadRecord.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveStale = resolve;
        }),
    );
    routeStub.setParams({ [KEY_ROUTE_PARAM]: UNKNOWN_KEY_PARAM });

    expect(page.status(), 'a param change restarts loading').toBe(AthleteStatus.loading);
    expect(page.year(), 'the year filter is reset for the new athlete').toBeNull();
    expect(page.sort(), 'the sort is reset for the new athlete').toBe(RunsSort.byTime);

    routeStub.setParams({ [KEY_ROUTE_PARAM]: DNF_ONLY_KEY });
    await settle();

    expect(page.status()).toBe(AthleteStatus.ready);
    expect(page.displayName()).toBe(EXPECTED_ROLLUP_HISTORY[DNF_ONLY_KEY].displayName);

    resolveStale(null);
    await settle();

    expect(page.status(), 'the stale "not found" must not override the newer view').toBe(AthleteStatus.ready);
    expect(page.displayName()).toBe(EXPECTED_ROLLUP_HISTORY[DNF_ONLY_KEY].displayName);
    expect(loadRecord).toHaveBeenCalledTimes(3);
  });

  it('shows notFound with a way back for an unknown key and keeps the view computeds empty', async () => {
    routeParams[KEY_ROUTE_PARAM] = UNKNOWN_KEY_PARAM;
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(AthleteStatus.notFound);
    expect(page.displayName()).toBe('');
    expect(page.participationCount()).toBe(0);
    expect(page.finishCount()).toBe(0);
    expect(page.finalsAttendanceText()).toBeNull();
    expect(page.gender(), 'no record — the chips keep the neutral labels').toBeNull();
    expect(page.hasRivals(), 'no record — no rivals card').toBe(false);
    expect(page.bestTimeText()).toBe(NO_BEST_TIME_TEXT);
    expect(page.yearBests()).toEqual([]);
    expect(page.years()).toEqual([]);
    expect(page.runs()).toEqual([]);
    expect(page.allRuns(), 'no record — the lifetime card gets nothing').toEqual([]);
    expect(page.streaks()).toEqual(EMPTY_STREAKS_VIEW);
    expect(page.currentActivity(), 'no record — an idle running year').toEqual(EMPTY_YEAR_ACTIVITY);
    expect(page.legend(), 'a notFound load discards the board').toEqual(EMPTY_LEGEND_VIEW);
    expect(page.rivals(), 'a notFound load discards the rival runs').toEqual([]);
    expect(page.memes(), 'no record — no meme ladder').toEqual([]);
    expect(page.yearBadges(), 'no record — no badges').toEqual([]);
    expect(page.versusLink(), 'the duel link degrades to an empty preselection').toEqual([VERSUS_PAGE_LINK, '']);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const statusRegion = element.querySelector('.athlete__status');

    expect(statusRegion.getAttribute('aria-live')).toBe('polite');
    expect(statusRegion.textContent.trim(), 'the notFound text is rendered inside the persistent live region').not.toBe('');
    expect(element.querySelector('.athlete__back').getAttribute('href')).toBe(ATHLETES_PAGE_LINK);
  });

  it('shows the error state when the history cannot be loaded, even without a key param', async () => {
    delete routeParams[KEY_ROUTE_PARAM];
    loadRecord.mockRejectedValue(new Error(ATHLETE_LOAD_ERROR_MESSAGE));
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(AthleteStatus.error);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.athlete__error').getAttribute('role')).toBe('alert');
  });

  it('leaves the weather card rows empty when the weather read fails', async () => {
    loadWeatherRows.mockRejectedValueOnce(new Error(ATHLETE_LOAD_ERROR_MESSAGE));
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status(), 'the weather is garnish — the page still renders').toBe(AthleteStatus.ready);
    expect(page.weatherRows()).toEqual([]);
  });
});

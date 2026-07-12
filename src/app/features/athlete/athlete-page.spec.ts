import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, provideRouter } from '@angular/router';

import { RunsSort } from '../../core/history/athlete-runs.enum';
import { EXPECTED_ROLLUP_HISTORY, DNF_ONLY_KEY, REPEAT_RUNNER_KEY } from '../../core/history/athletes-rollup.mock';
import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { AthletesService } from '../../github/athletes.service';
import { ATHLETES_PAGE_LINK, VERSUS_PAGE_LINK } from '../../app.constant';
import { ALL_YEARS_VALUE } from '../races/races-page.constant';
import { ActivatedRouteStub, activatedRouteStub } from '../spec-utils/activated-route-stub';
import { settle } from '../spec-utils/settle';
import { AthletePage } from './athlete-page';
import { KEY_ROUTE_PARAM, NO_BEST_TIME_TEXT } from './athlete-page.constant';
import { AthleteStatus } from './athlete-page.enum';
import {
  ATHLETE_LOAD_ERROR_MESSAGE,
  ATHLETE_YEAR_FILTER,
  DENORMALIZED_KEY_PARAM,
  EMPTY_LEGEND_VIEW,
  EMPTY_PLACEMENTS_VIEW,
  EMPTY_STREAKS_VIEW,
  EVENT_SLUG_CHRONOLOGY,
  EXPECTED_PLACEMENTS_VIEW,
  EXPECTED_BEST_TIME_TEXT,
  EXPECTED_BY_DATE_VIEWS,
  EXPECTED_BY_TIME_VIEWS,
  EXPECTED_CHASER_LEGEND_VIEW,
  EXPECTED_DNF_STREAKS_VIEW,
  EXPECTED_LEGEND_VIEW,
  EXPECTED_RUN_YEAR_OPTIONS,
  EXPECTED_SHORT_RUNNER_VIEWS,
  EXPECTED_STREAKS_VIEW,
  EXPECTED_YEAR_BEST_VIEWS,
  EXPECTED_YEAR_FILTERED_VIEWS,
  LEGEND_FINISHES,
  PLACEMENTS_EVENT_CHRONOLOGY,
  PLACEMENTS_RUN_PLACES,
  SHORT_RUNNER_KEY_PARAM,
  STUB_BADGE_RARITY,
  STUB_RUN_PLACES,
  UNKNOWN_KEY_PARAM,
} from './athlete-page.mock';

describe('AthletePage', () => {
  const loadRecord = vi.fn();
  const loadFirstEventDateByYear = vi.fn(() => Promise.resolve<Record<string, string>>({}));
  const loadEventSlugs = vi.fn(() => Promise.resolve([...EVENT_SLUG_CHRONOLOGY]));
  const loadYearBadgeRarity = vi.fn(() => Promise.resolve(STUB_BADGE_RARITY));
  const loadLegendFinishes = vi.fn(() => Promise.resolve([...LEGEND_FINISHES]));
  const loadRunPlaces = vi.fn((key: string) => Promise.resolve(key === REPEAT_RUNNER_KEY ? STUB_RUN_PLACES : {}));
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
          useValue: { loadRecord, loadFirstEventDateByYear, loadEventSlugs, loadYearBadgeRarity, loadLegendFinishes, loadRunPlaces },
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
    expect(page.progressRuns(), 'the sparkline receives the unfiltered 5 km history').toEqual(expectedRecord.runs);
    expect(page.bestTimeText()).toBe(EXPECTED_BEST_TIME_TEXT);
    expect(page.yearBests()).toEqual(EXPECTED_YEAR_BEST_VIEWS);
    expect(page.years()).toEqual(EXPECTED_RUN_YEAR_OPTIONS);
    expect(page.runs(), 'runs are sorted by time by default').toEqual(EXPECTED_BY_TIME_VIEWS);
    expect(page.streaks(), 'all three races form one running streak').toEqual(EXPECTED_STREAKS_VIEW);
    expect(page.badgeRarity(), 'the chips receive the loaded rarity shares').toEqual(STUB_BADGE_RARITY);
    expect(page.legend(), 'three windowed finishes keep the crown here').toEqual(EXPECTED_LEGEND_VIEW);

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
    expect(element.querySelector('.athlete__legend-crown'), 'the holder sees the crown line').not.toBeNull();
    expect(element.querySelector('.athlete__legend-bar'), 'the holder needs no progress bar').toBeNull();
  });

  it('filters by year, re-sorts by date and reports when no runs match', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    page.setSort(RunsSort.byDate);

    expect(page.runs()).toEqual(EXPECTED_BY_DATE_VIEWS);

    page.onYearChange(ATHLETE_YEAR_FILTER);

    expect(page.runs()).toEqual(EXPECTED_YEAR_FILTERED_VIEWS);

    page.onYearChange(ALL_YEARS_VALUE);

    expect(page.runs(), 'the "all years" chip resets the filter').toEqual(EXPECTED_BY_DATE_VIEWS);
    expect(page.year(), 'the "all" toggle maps the sentinel back to null').toBeNull();

    page.setYear(UNKNOWN_KEY_PARAM);

    expect(page.runs(), 'a year without runs empties the table').toEqual([]);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const sortChips = [...element.querySelectorAll('.athlete__filter')[1].querySelectorAll('.athlete__chip')];
    const statusRegions = [...element.querySelectorAll('.athlete__status')];

    expect(element.querySelector('.athlete__table-wrap')).toBeNull();
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
    loadEventSlugs.mockResolvedValueOnce([...PLACEMENTS_EVENT_CHRONOLOGY]);
    loadRunPlaces.mockResolvedValueOnce({ ...PLACEMENTS_RUN_PLACES });
    fixture = await createPage();

    expect(fixture.componentInstance.placements()).toEqual(EXPECTED_PLACEMENTS_VIEW);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const chips = [...element.querySelectorAll('.athlete__finals-chip')];

    expect(element.querySelector('.athlete__finals-title'), 'places are known — the finals card is shown').not.toBeNull();
    expect(chips.map((chip) => chip.textContent.trim())).toEqual(EXPECTED_PLACEMENTS_VIEW.podiumTexts);
  });

  it('shows the DNF-only athlete without records or a runs table', async () => {
    routeParams[KEY_ROUTE_PARAM] = DNF_ONLY_KEY;
    loadLegendFinishes.mockResolvedValueOnce([]);
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(AthleteStatus.ready);
    expect(page.finishCount()).toBe(0);
    expect(page.bestTimeText()).toBe(NO_BEST_TIME_TEXT);
    expect(page.yearBests()).toEqual([]);
    expect(page.streaks(), 'a DNF still counted as showing up, the later misses ended the streak').toEqual(EXPECTED_DNF_STREAKS_VIEW);
    expect(page.legend(), 'an empty board keeps the title vacant').toEqual(EMPTY_LEGEND_VIEW);
    expect(page.placements(), 'a DNF carries no place').toEqual(EMPTY_PLACEMENTS_VIEW);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const statusRegions = [...element.querySelectorAll('.athlete__status')];

    expect(element.querySelector('.athlete__finals'), 'no known places — no finals card').toBeNull();

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
    expect(page.bestTimeText()).toBe(NO_BEST_TIME_TEXT);
    expect(page.yearBests()).toEqual([]);
    expect(page.years()).toEqual([]);
    expect(page.runs()).toEqual([]);
    expect(page.streaks()).toEqual(EMPTY_STREAKS_VIEW);
    expect(page.legend(), 'a notFound load discards the board').toEqual(EMPTY_LEGEND_VIEW);
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
});

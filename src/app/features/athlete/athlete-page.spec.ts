import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, provideRouter } from '@angular/router';

import { RunsSort } from '../../core/history/athlete-runs.enum';
import { EXPECTED_ROLLUP_HISTORY, DNF_ONLY_KEY, REPEAT_RUNNER_KEY } from '../../core/history/athletes-rollup.mock';
import { TWO_THREE_KM_DISTANCE_KM } from '../../core/history/distance.constant';
import { AthletesHistory } from '../../core/models/athletes-history.type';
import { AthletesService } from '../../github/athletes.service';
import { ATHLETES_PAGE_LINK, NO_BEST_TIME_TEXT } from '../athletes/athletes-page.constant';
import { ActivatedRouteStub, activatedRouteStub } from '../spec-utils/activated-route-stub';
import { settle } from '../spec-utils/settle';
import { AthletePage } from './athlete-page';
import { ALL_OPTION_VALUE, KEY_ROUTE_PARAM } from './athlete-page.constant';
import { AthleteStatus } from './athlete-page.enum';
import {
  ATHLETE_LOAD_ERROR_MESSAGE,
  ATHLETE_YEAR_FILTER,
  DENORMALIZED_KEY_PARAM,
  EXPECTED_BEST_TIME_TEXT,
  EXPECTED_BY_DATE_VIEWS,
  EXPECTED_BY_TIME_VIEWS,
  EXPECTED_RUN_YEAR_OPTIONS,
  EXPECTED_YEAR_BEST_VIEWS,
  EXPECTED_SHORT_RUN_VIEW,
  EXPECTED_YEAR_FILTERED_VIEWS,
  SHORT_RUNNER_KEY_PARAM,
  UNKNOWN_KEY_PARAM,
} from './athlete-page.mock';

describe('AthletePage', () => {
  const loadHistory = vi.fn();
  const routeParams: Params = {};

  let routeStub: ActivatedRouteStub;
  let fixture: ComponentFixture<AthletePage>;

  beforeEach(() => {
    vi.clearAllMocks();
    routeParams[KEY_ROUTE_PARAM] = DENORMALIZED_KEY_PARAM;
    loadHistory.mockResolvedValue(EXPECTED_ROLLUP_HISTORY);
    routeStub = activatedRouteStub(routeParams);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AthletesService, useValue: { loadHistory } },
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

  it('normalizes the route key and renders the header, records and the runs table (newest first)', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;
    const expectedRecord = EXPECTED_ROLLUP_HISTORY[REPEAT_RUNNER_KEY];

    expect(page.status()).toBe(AthleteStatus.ready);
    expect(page.displayName()).toBe(expectedRecord.displayName);
    expect(page.participationCount()).toBe(expectedRecord.participationSlugs.length);
    expect(page.finishCount()).toBe(expectedRecord.runs.length);
    expect(page.bestTimeText()).toBe(EXPECTED_BEST_TIME_TEXT);
    expect(page.yearBests()).toEqual(EXPECTED_YEAR_BEST_VIEWS);
    expect(page.years()).toEqual(EXPECTED_RUN_YEAR_OPTIONS);
    expect(page.runs()).toEqual(EXPECTED_BY_DATE_VIEWS);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const headers = [...element.querySelectorAll('.athlete__th')];
    const raceLinks = [...element.querySelectorAll('.athlete__race')];
    const yearOptions = [...element.querySelectorAll('#athlete-year option')];

    expect(element.querySelector('.athlete__status').getAttribute('aria-live'), 'the live region stays in the DOM across states').toBe(
      'polite',
    );
    expect(element.querySelector('.athlete__status').textContent.trim(), 'the live region is empty once the history is ready').toBe('');
    expect(element.querySelector('.athlete__title').textContent.trim()).toBe(expectedRecord.displayName);
    expect(headers.map((header) => header.getAttribute('scope'))).toEqual(['col', 'col', 'col']);
    expect(raceLinks.map((link) => link.textContent.trim())).toEqual(EXPECTED_BY_DATE_VIEWS.map((view) => view.dateShort));
    expect(raceLinks[0].getAttribute('href'), 'the date links to the online protocol').toBe(EXPECTED_BY_DATE_VIEWS[0].raceLink.join('/'));
    expect(yearOptions.length, 'the "all years" option plus one per distinct year').toBe(EXPECTED_RUN_YEAR_OPTIONS.length + 1);
    expect(element.querySelector('.athlete__filter-label[for="athlete-distance"]')).not.toBeNull();
  });

  it('filters by year and distance, re-sorts by time and reports when no runs match', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    page.setSort(RunsSort.byTime);

    expect(page.runs()).toEqual(EXPECTED_BY_TIME_VIEWS);

    page.setSort(RunsSort.byDate);
    page.onYearChange(ATHLETE_YEAR_FILTER);

    expect(page.runs()).toEqual(EXPECTED_YEAR_FILTERED_VIEWS);

    page.onYearChange(ALL_OPTION_VALUE);

    expect(page.runs(), 'the "all years" option resets the filter').toEqual(EXPECTED_BY_DATE_VIEWS);

    page.onDistanceChange(String(TWO_THREE_KM_DISTANCE_KM));

    expect(page.runs(), 'the athlete has no 2.3 km runs').toEqual([]);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const sortButtons = [...element.querySelectorAll('.athlete__sort')];

    const statusRegions = [...element.querySelectorAll('.athlete__status')];

    expect(element.querySelector('.athlete__table-wrap')).toBeNull();
    expect(statusRegions.at(-1).getAttribute('role')).toBe('status');
    expect(statusRegions.at(-1).textContent.trim(), 'the "no filtered runs" note lives in the persistent live region').not.toBe('');
    expect(sortButtons.map((button) => button.getAttribute('aria-pressed'))).toEqual(['true', 'false']);

    page.onDistanceChange(ALL_OPTION_VALUE);

    expect(page.runs(), 'the "all distances" option resets the filter').toEqual(EXPECTED_BY_DATE_VIEWS);
  });

  it('labels a 2.3 km run with the short distance and keeps it when filtering by that distance', async () => {
    routeParams[KEY_ROUTE_PARAM] = SHORT_RUNNER_KEY_PARAM;
    fixture = await createPage();

    const page = fixture.componentInstance;

    page.onDistanceChange(String(TWO_THREE_KM_DISTANCE_KM));

    expect(page.runs()).toEqual([EXPECTED_SHORT_RUN_VIEW]);
  });

  it('shows the DNF-only athlete without records or a runs table', async () => {
    routeParams[KEY_ROUTE_PARAM] = DNF_ONLY_KEY;
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(AthleteStatus.ready);
    expect(page.finishCount()).toBe(0);
    expect(page.bestTimeText()).toBe(NO_BEST_TIME_TEXT);
    expect(page.yearBests()).toEqual([]);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const statusRegions = [...element.querySelectorAll('.athlete__status')];

    expect(statusRegions.at(-1).getAttribute('aria-live'), 'the "no finishes" note is announced').toBe('polite');
    expect(statusRegions.at(-1).textContent.trim()).not.toBe('');
    expect(element.querySelector('.athlete__table-wrap')).toBeNull();
    expect(element.querySelector('.athlete__controls')).toBeNull();
  });

  it('reloads on a same-route key change, resetting the filters, and drops a stale response', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    page.onYearChange(ATHLETE_YEAR_FILTER);
    page.onDistanceChange(String(TWO_THREE_KM_DISTANCE_KM));
    page.setSort(RunsSort.byTime);

    let resolveStale: (history: AthletesHistory) => void = vi.fn();

    loadHistory.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveStale = resolve;
        }),
    );
    routeStub.setParams({ [KEY_ROUTE_PARAM]: UNKNOWN_KEY_PARAM });

    expect(page.status(), 'a param change restarts loading').toBe(AthleteStatus.loading);
    expect(page.year(), 'the year filter is reset for the new athlete').toBeNull();
    expect(page.distanceKm(), 'the distance filter is reset for the new athlete').toBeNull();
    expect(page.sort(), 'the sort is reset for the new athlete').toBe(RunsSort.byDate);

    loadHistory.mockResolvedValueOnce(EXPECTED_ROLLUP_HISTORY);
    routeStub.setParams({ [KEY_ROUTE_PARAM]: DNF_ONLY_KEY });
    await settle();

    expect(page.status()).toBe(AthleteStatus.ready);
    expect(page.displayName()).toBe(EXPECTED_ROLLUP_HISTORY[DNF_ONLY_KEY].displayName);

    resolveStale(EXPECTED_ROLLUP_HISTORY);
    await settle();

    expect(page.status(), 'the stale "not found" must not override the newer view').toBe(AthleteStatus.ready);
    expect(page.displayName()).toBe(EXPECTED_ROLLUP_HISTORY[DNF_ONLY_KEY].displayName);
    expect(loadHistory).toHaveBeenCalledTimes(3);
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

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const statusRegion = element.querySelector('.athlete__status');

    expect(statusRegion.getAttribute('aria-live')).toBe('polite');
    expect(statusRegion.textContent.trim(), 'the notFound text is rendered inside the persistent live region').not.toBe('');
    expect(element.querySelector('.athlete__back').getAttribute('href')).toBe(ATHLETES_PAGE_LINK);
  });

  it('shows the error state when the history cannot be loaded, even without a key param', async () => {
    delete routeParams[KEY_ROUTE_PARAM];
    loadHistory.mockRejectedValue(new Error(ATHLETE_LOAD_ERROR_MESSAGE));
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(AthleteStatus.error);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.athlete__error').getAttribute('role')).toBe('alert');
  });
});

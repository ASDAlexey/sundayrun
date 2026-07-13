import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, provideRouter } from '@angular/router';

import { YearReview } from '../../core/history/year-review.interface';
import { YearReviewService } from '../../github/year-review.service';
import { ActivatedRouteStub, activatedRouteStub } from '../spec-utils/activated-route-stub';
import { settle } from '../spec-utils/settle';
import { YearPage } from './year-page';
import { YEAR_ROUTE_PARAM } from './year-page.constant';
import { YearStatus } from './year-page.enum';
import {
  AVAILABLE_YEARS,
  BESTLESS_STAT_COUNT,
  BESTLESS_YEAR_REVIEW,
  REQUESTED_YEAR,
  REQUESTED_YEAR_REVIEW,
  UNKNOWN_YEAR,
  YEAR_LOAD_ERROR_MESSAGE,
  YEAR_REVIEW,
} from './year-page.mock';

describe('YearPage', () => {
  const loadYears = vi.fn(() => Promise.resolve(AVAILABLE_YEARS));
  const loadReview = vi.fn((year: string) => Promise.resolve(year === REQUESTED_YEAR ? REQUESTED_YEAR_REVIEW : YEAR_REVIEW));
  const routeParams: Params = {};

  let routeStub: ActivatedRouteStub;
  let fixture: ComponentFixture<YearPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    delete routeParams[YEAR_ROUTE_PARAM];
    routeStub = activatedRouteStub(routeParams);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: YearReviewService, useValue: { loadYears, loadReview } },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  async function createPage(): Promise<ComponentFixture<YearPage>> {
    const created = TestBed.createComponent(YearPage);

    await settle();

    return created;
  }

  it('opens the newest year without a param, switches by param, and maps an unknown year to notFound', async () => {
    fixture = await createPage();

    expect(loadReview).toHaveBeenCalledWith(AVAILABLE_YEARS[0]);
    expect(fixture.componentInstance.status()).toBe(YearStatus.ready);
    expect(fixture.componentInstance.years()).toEqual(AVAILABLE_YEARS);
    expect(fixture.componentInstance.view()?.year).toBe(YEAR_REVIEW.year);
    expect(fixture.componentInstance.view()?.stats.length).toBeGreaterThan(0);
    expect(fixture.componentInstance.view()?.badgeGroups.length).toBe(YEAR_REVIEW.badgeHolders.length);
    expect(
      fixture.componentInstance.view()?.bestMen.map((row) => row.place),
      'the men’s best-results board ranks like the records page',
    ).toEqual(YEAR_REVIEW.bestMen.map((_, index) => index + 1));
    expect(fixture.componentInstance.view()?.bestWomen.length).toBe(YEAR_REVIEW.bestWomen.length);
    expect(
      fixture.componentInstance.view()?.mostActive.map((row) => row.place),
      'the activity board carries places too',
    ).toEqual(YEAR_REVIEW.mostActive.map((_, index) => index + 1));

    routeStub.setParams({ [YEAR_ROUTE_PARAM]: REQUESTED_YEAR });
    await settle();

    expect(loadReview).toHaveBeenCalledWith(REQUESTED_YEAR);
    expect(fixture.componentInstance.view()?.year).toBe(REQUESTED_YEAR);

    routeStub.setParams({ [YEAR_ROUTE_PARAM]: UNKNOWN_YEAR });
    await settle();

    expect(fixture.componentInstance.status()).toBe(YearStatus.notFound);
    expect(fixture.componentInstance.view()).toBeNull();
  });

  it('maps an empty archive to notFound, hides the missing bests and medians, and drops a stale review', async () => {
    loadYears.mockResolvedValueOnce([]);
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status(), 'no years at all — nothing to open').toBe(YearStatus.notFound);
    expect(page.years()).toEqual([]);

    loadReview.mockResolvedValueOnce(BESTLESS_YEAR_REVIEW);
    routeStub.setParams({ [YEAR_ROUTE_PARAM]: AVAILABLE_YEARS[0] });
    await settle();

    expect(page.status()).toBe(YearStatus.ready);
    expect(page.view()?.bestMen, 'an empty year renders no best-results boards').toEqual([]);
    expect(page.view()?.bestWomen).toEqual([]);
    expect(page.view()?.stats.length, 'unknown medians never become stat tiles').toBe(BESTLESS_STAT_COUNT);

    let resolveStale: (review: YearReview) => void = vi.fn();

    loadReview.mockImplementationOnce(
      () =>
        new Promise<YearReview>((resolve) => {
          resolveStale = resolve;
        }),
    );
    routeStub.setParams({ [YEAR_ROUTE_PARAM]: REQUESTED_YEAR });
    routeStub.setParams({ [YEAR_ROUTE_PARAM]: AVAILABLE_YEARS[0] });
    await settle();

    expect(page.view()?.year).toBe(AVAILABLE_YEARS[0]);

    resolveStale(REQUESTED_YEAR_REVIEW);
    await settle();

    expect(page.view()?.year, 'the stale review must not override the newer view').toBe(AVAILABLE_YEARS[0]);
  });

  it('surfaces a load failure as the error state', async () => {
    loadYears.mockRejectedValueOnce(new Error(YEAR_LOAD_ERROR_MESSAGE));
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(YearStatus.error);
    expect(fixture.componentInstance.view()).toBeNull();
  });
});

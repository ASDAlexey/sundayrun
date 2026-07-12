import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, provideRouter } from '@angular/router';

import { YearReviewService } from '../../github/year-review.service';
import { ActivatedRouteStub, activatedRouteStub } from '../spec-utils/activated-route-stub';
import { settle } from '../spec-utils/settle';
import { YearPage } from './year-page';
import { YEAR_ROUTE_PARAM } from './year-page.constant';
import { YearStatus } from './year-page.enum';
import {
  AVAILABLE_YEARS,
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

    routeStub.setParams({ [YEAR_ROUTE_PARAM]: REQUESTED_YEAR });
    await settle();

    expect(loadReview).toHaveBeenCalledWith(REQUESTED_YEAR);
    expect(fixture.componentInstance.view()?.year).toBe(REQUESTED_YEAR);

    routeStub.setParams({ [YEAR_ROUTE_PARAM]: UNKNOWN_YEAR });
    await settle();

    expect(fixture.componentInstance.status()).toBe(YearStatus.notFound);
    expect(fixture.componentInstance.view()).toBeNull();
  });

  it('surfaces a load failure as the error state', async () => {
    loadYears.mockRejectedValueOnce(new Error(YEAR_LOAD_ERROR_MESSAGE));
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(YearStatus.error);
    expect(fixture.componentInstance.view()).toBeNull();
  });
});

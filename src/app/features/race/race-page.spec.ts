import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, provideRouter } from '@angular/router';

import { buildEventResultsFile } from '../../core/github/results-file';
import { EventResultsFile } from '../../core/github/results-file.interface';
import { PROTOCOL_ROWS, RACE_EVENT } from '../../core/github/spec-utils/race-fixtures';
import { CdnRefService } from '../../github/cdn-ref.service';
import { cdnRefServiceMock } from '../../github/cdn-ref.service.mock';
import { ResultsService } from '../../github/results.service';
import { ProtocolPdfService } from '../../pdf/protocol-pdf.service';
import { ActivatedRouteStub, activatedRouteStub } from '../spec-utils/activated-route-stub';
import { settle } from '../spec-utils/settle';
import { RacePage } from './race-page';
import { SLUG_ROUTE_PARAM } from './race-page.constant';
import { RaceStatus } from './race-page.enum';
import {
  EXPECTED_RACE_VIEW,
  MALFORMED_RACE_SLUG,
  RACE_PAGE_SLUG,
  RESULTS_LOAD_ERROR_MESSAGE,
  UNPUBLISHED_RACE_SLUG,
} from './race-page.mock';

describe('RacePage', () => {
  const loadResults = vi.fn();
  const download = vi.fn();
  const routeParams: Params = {};

  let routeStub: ActivatedRouteStub;
  let fixture: ComponentFixture<RacePage>;

  beforeEach(() => {
    vi.clearAllMocks();
    routeParams[SLUG_ROUTE_PARAM] = RACE_PAGE_SLUG;
    loadResults.mockResolvedValue(buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS));
    routeStub = activatedRouteStub(routeParams);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ResultsService, useValue: { loadResults } },
        { provide: ProtocolPdfService, useValue: { download } },
        { provide: CdnRefService, useValue: cdnRefServiceMock() },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  async function createPage(): Promise<ComponentFixture<RacePage>> {
    const created = TestBed.createComponent(RacePage);

    await settle();

    return created;
  }

  it('renders the protocol header and the PDF-shaped table with athlete links', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(loadResults).toHaveBeenCalledExactlyOnceWith(RACE_PAGE_SLUG);
    expect(page.status()).toBe(RaceStatus.ready);
    expect(page.race()).toEqual(EXPECTED_RACE_VIEW);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const pdfButton = element.querySelector('.race__pdf');
    const headers = [...element.querySelectorAll('.race__th')];
    const athleteLinks = [...element.querySelectorAll('.race__athlete')];
    const statusRegion = element.querySelector('.race__status');

    expect(statusRegion.getAttribute('aria-live'), 'the live region stays in the DOM across states').toBe('polite');
    expect(statusRegion.textContent.trim(), 'the live region is empty once the protocol is ready').toBe('');

    expect(element.querySelector('.race__title').textContent).toContain(String(EXPECTED_RACE_VIEW.number));
    expect(element.querySelector('.race__date').textContent.trim()).toBe(EXPECTED_RACE_VIEW.dateLong);
    expect(element.querySelector('.race__count').textContent).toContain(String(EXPECTED_RACE_VIEW.participantCount));

    const avgLines = [...element.querySelectorAll('.race__avg')];

    expect(avgLines.length, 'only genders with 5 km finishers get an average line').toBe(1);
    expect(avgLines[0].textContent).toContain(EXPECTED_RACE_VIEW.avgTimeF);
    expect(pdfButton.tagName, 'the pdf action generates on click instead of linking to a file').toBe('BUTTON');
    expect(pdfButton.getAttribute('aria-label')).toBe(EXPECTED_RACE_VIEW.pdfAriaLabel);
    expect(headers.length, 'the nine PDF columns plus the average pace').toBe(10);
    expect(
      headers.map((header) => header.getAttribute('scope')),
      'every header is a column header',
    ).toEqual(headers.map(() => 'col'));
    expect(athleteLinks.map((link) => link.textContent.trim())).toEqual(EXPECTED_RACE_VIEW.rows.map((row) => row.fullName));
    expect(athleteLinks.map((link) => link.getAttribute('aria-label'))).toEqual(EXPECTED_RACE_VIEW.rows.map((row) => row.athleteAriaLabel));
    expect(athleteLinks[0].getAttribute('href'), 'the athlete link targets the personal page by key').toBe(
      `${EXPECTED_RACE_VIEW.rows[0].athleteLink[0]}/${encodeURIComponent(EXPECTED_RACE_VIEW.rows[0].athleteLink[1])}`,
    );
  });

  it('shows notFound for a malformed slug without touching the CDN', async () => {
    routeParams[SLUG_ROUTE_PARAM] = MALFORMED_RACE_SLUG;
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(RaceStatus.notFound);
    expect(loadResults).not.toHaveBeenCalled();

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const statusRegion = element.querySelector('.race__status');

    expect(statusRegion.getAttribute('aria-live')).toBe('polite');
    expect(statusRegion.textContent.trim(), 'the notFound text is rendered inside the persistent live region').not.toBe('');
    expect(element.querySelector('.race__back').getAttribute('href')).toBe('/');
  });

  it('treats a missing slug param as notFound', async () => {
    delete routeParams[SLUG_ROUTE_PARAM];
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(RaceStatus.notFound);
    expect(loadResults).not.toHaveBeenCalled();
  });

  it('shows notFound when the CDN has no results file for the slug', async () => {
    routeParams[SLUG_ROUTE_PARAM] = UNPUBLISHED_RACE_SLUG;
    loadResults.mockResolvedValue(null);
    fixture = await createPage();

    expect(loadResults).toHaveBeenCalledExactlyOnceWith(UNPUBLISHED_RACE_SLUG);
    expect(fixture.componentInstance.status()).toBe(RaceStatus.notFound);
    expect(fixture.componentInstance.race()).toBeNull();
  });

  it('reloads on a same-route slug change and drops a stale response', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.race()).toEqual(EXPECTED_RACE_VIEW);

    let resolveStale: (file: EventResultsFile | null) => void = vi.fn();

    loadResults.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveStale = resolve;
        }),
    );
    routeStub.setParams({ [SLUG_ROUTE_PARAM]: UNPUBLISHED_RACE_SLUG });

    expect(page.status(), 'a param change restarts loading').toBe(RaceStatus.loading);
    expect(page.race()).toBeNull();

    loadResults.mockResolvedValueOnce(buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS));
    routeStub.setParams({ [SLUG_ROUTE_PARAM]: RACE_PAGE_SLUG });
    await settle();

    expect(page.status()).toBe(RaceStatus.ready);
    expect(page.race()).toEqual(EXPECTED_RACE_VIEW);

    resolveStale(null);
    await settle();

    expect(page.status(), 'the stale "not found" must not override the newer view').toBe(RaceStatus.ready);
    expect(page.race()).toEqual(EXPECTED_RACE_VIEW);
    expect(loadResults).toHaveBeenCalledTimes(3);
  });

  it('shows the error state when the results cannot be loaded', async () => {
    loadResults.mockRejectedValue(new Error(RESULTS_LOAD_ERROR_MESSAGE));
    fixture = await createPage();

    expect(fixture.componentInstance.status()).toBe(RaceStatus.error);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.race__error').getAttribute('role')).toBe('alert');
  });

  it('generates and downloads the protocol for the current slug, spinning meanwhile', async () => {
    download.mockResolvedValue(undefined);
    fixture = await createPage();

    const page = fixture.componentInstance;
    const pending = page.downloadPdf();

    expect(page.pdfLoading()).toBe(true);

    await pending;

    expect(download).toHaveBeenCalledExactlyOnceWith(RACE_PAGE_SLUG);
    expect(page.pdfLoading()).toBe(false);
    expect(page.pdfFailed()).toBe(false);
  });

  it('ignores a second pdf click while one is in flight', async () => {
    let release: () => void = () => undefined;

    download.mockReturnValue(new Promise<void>((resolve) => (release = resolve)));
    fixture = await createPage();

    const page = fixture.componentInstance;
    const first = page.downloadPdf();

    await page.downloadPdf();
    release();
    await first;

    expect(download).toHaveBeenCalledOnce();
  });

  it('flags the failure and drops the spinner when pdf generation throws', async () => {
    download.mockRejectedValue(new Error('boom'));
    fixture = await createPage();

    const page = fixture.componentInstance;

    await page.downloadPdf();

    expect(page.pdfFailed()).toBe(true);
    expect(page.pdfLoading()).toBe(false);
  });
});

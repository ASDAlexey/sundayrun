import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, provideRouter } from '@angular/router';

import { buildEventResultsFile } from '../../core/github/results-file';
import { EventResultsFile } from '../../core/github/results-file.interface';
import { PROTOCOL_ROWS, RACE_EVENT } from '../../core/github/spec-utils/race-fixtures';
import { AthletesService } from '../../github/athletes.service';
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
  EXPECTED_RANK_FINISH_COUNT_TEXTS,
  EXPECTED_RANK_NOTABLE_TEXT,
  EXPECTED_WINDOW_NOTABLE_TEXT,
  FINAL_MONTH_CHRONOLOGY,
  MALFORMED_RACE_SLUG,
  OPEN_MONTH_CHRONOLOGY,
  RACE_PAGE_SLUG,
  RACE_TODAY_ISO,
  RANK_PARTICIPANT_RUNS,
  RESULTS_LOAD_ERROR_MESSAGE,
  UNPUBLISHED_RACE_SLUG,
  WINDOW_PARTICIPANT_RUNS,
} from './race-page.mock';

describe('RacePage', () => {
  const loadResults = vi.fn();
  const loadParticipantRuns = vi.fn();
  const loadEventSlugs = vi.fn();
  const download = vi.fn();
  const routeParams: Params = {};

  let routeStub: ActivatedRouteStub;
  let fixture: ComponentFixture<RacePage>;

  beforeEach(() => {
    vi.clearAllMocks();
    // The month-final mark depends on the calendar, so only Date is faked (real timers keep `settle` working).
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(RACE_TODAY_ISO));
    routeParams[SLUG_ROUTE_PARAM] = RACE_PAGE_SLUG;
    loadResults.mockResolvedValue(buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS));
    loadParticipantRuns.mockResolvedValue([]);
    loadEventSlugs.mockResolvedValue(OPEN_MONTH_CHRONOLOGY);
    routeStub = activatedRouteStub(routeParams);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ResultsService, useValue: { loadResults, loadParticipantRuns } },
        { provide: AthletesService, useValue: { loadEventSlugs } },
        { provide: ProtocolPdfService, useValue: { download } },
        { provide: CdnRefService, useValue: cdnRefServiceMock() },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
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
    expect(element.querySelector('.race__final-badge'), 'a later June race exists — no month-final badge').toBeNull();
    expect(element.querySelector('.race__date').textContent.trim()).toBe(EXPECTED_RACE_VIEW.dateLong);
    expect(element.querySelector('.race__count').textContent).toContain(String(EXPECTED_RACE_VIEW.participantCount));
    expect(element.querySelector('.race__summary').textContent.trim()).toBe(EXPECTED_RACE_VIEW.summaryText);

    const medianLines = [...element.querySelectorAll('.race__median')];

    expect(medianLines.length, 'only genders with 5 km finishers get an average line').toBe(1);
    expect(medianLines[0].textContent).toContain(EXPECTED_RACE_VIEW.medianTimeF);
    expect(pdfButton.tagName, 'the pdf action generates on click instead of linking to a file').toBe('BUTTON');
    expect(pdfButton.getAttribute('aria-label')).toBe(EXPECTED_RACE_VIEW.pdfAriaLabel);
    expect(headers.length, 'the ten PDF columns plus the average pace').toBe(11);
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

  it('decorates finishers with on-the-fly notables and survives a failed history read', async () => {
    loadParticipantRuns.mockResolvedValueOnce(RANK_PARTICIPANT_RUNS);
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(loadParticipantRuns).toHaveBeenCalledWith(RACE_PAGE_SLUG);
    expect(
      page.race()?.rows.map((row) => row.notableText),
      'only Мария ranks — the others have no 5 km run here',
    ).toEqual([EXPECTED_RANK_NOTABLE_TEXT, '', '']);
    expect(
      page.race()?.rows.map((row) => row.finishCountText),
      'the «Финишей» counter tallies the same runs the notables rank',
    ).toEqual(EXPECTED_RANK_FINISH_COUNT_TEXTS);

    fixture.detectChanges();

    const chips = [...fixture.nativeElement.querySelectorAll('.race__notable')];

    expect(chips.map((chip: Element) => chip.textContent?.trim())).toEqual([EXPECTED_RANK_NOTABLE_TEXT]);

    loadParticipantRuns.mockResolvedValueOnce(WINDOW_PARTICIPANT_RUNS);
    routeStub.setParams({ [SLUG_ROUTE_PARAM]: RACE_PAGE_SLUG });
    await settle();

    expect(page.race()?.rows[0].notableText, 'not a top-3 run, but the best of the trailing window').toBe(EXPECTED_WINDOW_NOTABLE_TEXT);

    loadParticipantRuns.mockRejectedValueOnce(new Error(RESULTS_LOAD_ERROR_MESSAGE));
    routeStub.setParams({ [SLUG_ROUTE_PARAM]: RACE_PAGE_SLUG });
    await settle();

    expect(page.status(), 'the notables are garnish — the protocol still renders').toBe(RaceStatus.ready);
    expect(page.race()?.rows[0].notableText).toBe('');
  });

  it('marks the month-final protocol with the «итоговый» badge and shrugs off a failed chronology read', async () => {
    loadEventSlugs.mockResolvedValueOnce(FINAL_MONTH_CHRONOLOGY);
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.race()?.isMonthFinal, 'the next race is already July, so this one closes June').toBe(true);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.race__final-badge')).not.toBeNull();

    loadEventSlugs.mockRejectedValueOnce(new Error(RESULTS_LOAD_ERROR_MESSAGE));
    routeStub.setParams({ [SLUG_ROUTE_PARAM]: RACE_PAGE_SLUG });
    await settle();

    expect(page.status(), 'the mark is garnish — the protocol still renders').toBe(RaceStatus.ready);
    expect(page.race()?.isMonthFinal).toBe(false);
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

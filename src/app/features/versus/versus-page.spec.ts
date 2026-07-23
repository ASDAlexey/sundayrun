import { PLATFORM_ID, WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Params, Router, provideRouter } from '@angular/router';

import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { AthletesService } from '../../github/athletes.service';
import { SelfAthlete } from '../../state/self-athlete.interface';
import { SelfAthleteService } from '../../state/self-athlete.service';
import { VERSUS_PAGE_LINK } from '../../app.constant';
import { ActivatedRouteStub, activatedRouteStub } from '../spec-utils/activated-route-stub';
import { BROWSER_PLATFORM_ID, SERVER_PLATFORM_ID } from '../spec-utils/platform.mock';
import { settle } from '../spec-utils/settle';
import { VersusPage } from './versus-page';
import { LEFT_ROUTE_PARAM, RIGHT_ROUTE_PARAM } from './versus-page.constant';
import { DuelStatus, VersusStatus } from './versus-page.enum';
import {
  DIRECTORY_RECORDS,
  EXPECTED_DRAW_COUNT,
  EXPECTED_LEFT_SIDE,
  EXPECTED_MEETING_VIEWS,
  EXPECTED_RIGHT_SIDE,
  EXPECTED_SHARED_PREFIX_OPTIONS,
  EXPECTED_SUGGESTION_OPTION,
  LEFT_KEY,
  LEFT_KEY_PARAM,
  RIGHT_KEY,
  SHARED_PREFIX_QUERY,
  SUGGESTION_QUERY,
  UNKNOWN_KEY,
  VERSUS_FIRST_LAPS,
  VERSUS_LOAD_ERROR_MESSAGE,
  VERSUS_RECORDS,
  VERSUS_SELF_PICK,
  EXPECTED_SPLIT_LEAD_TEXT,
  EXPECTED_WINNING_TIMES,
} from './versus-page.mock';

describe('VersusPage', () => {
  const loadRecord = vi.fn();
  const loadRecords = vi.fn();
  const loadFirstLaps = vi.fn();
  const routeParams: Params = {};

  let platformId = BROWSER_PLATFORM_ID;
  let routeStub: ActivatedRouteStub;
  let selfSignal: WritableSignal<SelfAthlete | null>;
  let fixture: ComponentFixture<VersusPage>;

  beforeEach(() => {
    vi.clearAllMocks();
    platformId = BROWSER_PLATFORM_ID;
    delete routeParams[LEFT_ROUTE_PARAM];
    delete routeParams[RIGHT_ROUTE_PARAM];
    loadRecord.mockImplementation((key: string) => Promise.resolve(VERSUS_RECORDS[key] ?? null));
    loadRecords.mockImplementation(() => Promise.resolve(DIRECTORY_RECORDS));
    loadFirstLaps.mockImplementation((key: string) => Promise.resolve(VERSUS_FIRST_LAPS[key] ?? []));
    routeStub = activatedRouteStub(routeParams);
    selfSignal = signal<SelfAthlete | null>(null);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AthletesService, useValue: { loadRecord, loadRecords, loadFirstLaps } },
        { provide: SelfAthleteService, useValue: { self: selfSignal } },
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: PLATFORM_ID, useFactory: () => platformId },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  async function createPage(): Promise<ComponentFixture<VersusPage>> {
    const created = TestBed.createComponent(VersusPage);

    await settle();

    return created;
  }

  it('normalizes the route pair, scores the duel and highlights the winner of every meeting', async () => {
    routeParams[LEFT_ROUTE_PARAM] = LEFT_KEY_PARAM;
    routeParams[RIGHT_ROUTE_PARAM] = RIGHT_KEY;
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(VersusStatus.ready);
    expect(page.duelStatus()).toBe(DuelStatus.ready);
    expect(page.leftSide()).toEqual(EXPECTED_LEFT_SIDE);
    expect(page.rightSide()).toEqual(EXPECTED_RIGHT_SIDE);
    expect(page.meetingCount()).toBe(EXPECTED_MEETING_VIEWS.length);
    expect(page.drawCount()).toBe(EXPECTED_DRAW_COUNT);
    expect(page.meetings()).toEqual(EXPECTED_MEETING_VIEWS);
    expect(page.splitLeadText(), 'one split lead each over the two split-bearing meetings').toBe(EXPECTED_SPLIT_LEAD_TEXT);
    expect(page.pickerOpen(), 'a settled duel hides the search box').toBe(false);

    page.onQueryChange(SUGGESTION_QUERY);

    expect(page.suggestions(), 'namesakes still suggest with both slots filled').toEqual([EXPECTED_SUGGESTION_OPTION]);

    fixture.detectChanges();

    const element = fixture.nativeElement;
    const wonTimes = [...element.querySelectorAll('.versus__medal')].map((medal: Element) => medal.closest('.versus__time'));

    expect(element.querySelector('.versus__score').textContent.trim()).toBe(`${EXPECTED_LEFT_SIDE.wins} : ${EXPECTED_RIGHT_SIDE.wins}`);
    expect(element.querySelectorAll('.versus__meeting').length).toBe(EXPECTED_MEETING_VIEWS.length);
    expect(
      wonTimes.map((time: Element | null) => time?.textContent?.trim()),
      'exactly one winning time per decided meeting, none for the draw',
    ).toEqual(EXPECTED_WINNING_TIMES);
    expect(element.querySelector('.versus__date').getAttribute('href')).toBe(EXPECTED_MEETING_VIEWS[0].raceLink.join('/'));
    expect(element.querySelectorAll('.versus__split-flag').length, 'one lead flag per split-bearing meeting').toBe(2);
    expect(element.querySelector('.versus__search'), 'no search box once both slots are filled').toBeNull();

    loadFirstLaps.mockRejectedValue(new Error(VERSUS_LOAD_ERROR_MESSAGE));
    routeStub.setParams({ [LEFT_ROUTE_PARAM]: LEFT_KEY, [RIGHT_ROUTE_PARAM]: RIGHT_KEY });
    await settle();

    expect(page.duelStatus(), 'failed lap reads are garnish — the duel still settles').toBe(DuelStatus.ready);
    expect(page.splitLeadText(), 'no splits — no lead line').toBeNull();
  });

  it('suggests by a normalized query without the picked athletes; picking navigates to the shareable duel', async () => {
    fixture = await createPage();

    const page = fixture.componentInstance;
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    expect(page.duelStatus()).toBe(DuelStatus.idle);
    expect(page.meetingCount(), 'no pair yet — the duel numbers stay zeroed').toBe(0);
    expect(page.drawCount()).toBe(0);
    expect(page.meetings()).toEqual([]);
    expect(page.suggestions(), 'an empty query suggests nothing').toEqual([]);

    page.onQueryChange(SUGGESTION_QUERY);

    expect(page.suggestions()).toEqual([EXPECTED_SUGGESTION_OPTION]);

    page.pick(LEFT_KEY);

    expect(page.query(), 'picking clears the query').toBe('');
    expect(navigate).toHaveBeenCalledWith([VERSUS_PAGE_LINK, LEFT_KEY]);

    routeStub.setParams({ [LEFT_ROUTE_PARAM]: LEFT_KEY });
    await settle();

    expect(page.duelStatus(), 'one filled slot keeps the duel idle').toBe(DuelStatus.idle);
    expect(page.leftSide()?.displayName).toBe(EXPECTED_LEFT_SIDE.displayName);
    expect(page.rightSide()).toBeNull();

    page.onQueryChange(SHARED_PREFIX_QUERY);

    expect(page.suggestions(), 'the picked athlete never suggests itself').toEqual(EXPECTED_SHARED_PREFIX_OPTIONS);

    page.pick(RIGHT_KEY);

    expect(navigate).toHaveBeenCalledWith([VERSUS_PAGE_LINK, LEFT_KEY, RIGHT_KEY]);

    page.clearRight();

    expect(navigate).toHaveBeenCalledWith([VERSUS_PAGE_LINK, LEFT_KEY]);

    page.clearLeft();

    expect(navigate, 'clearing the only athlete lands on the bare picker').toHaveBeenCalledWith([VERSUS_PAGE_LINK]);
  });

  it('drops the self-duel second key and a stale response', async () => {
    routeParams[LEFT_ROUTE_PARAM] = LEFT_KEY;
    routeParams[RIGHT_ROUTE_PARAM] = LEFT_KEY;
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.duelStatus(), 'the duplicated key is dropped, the duel stays idle').toBe(DuelStatus.idle);
    expect(page.leftSide()?.key).toBe(LEFT_KEY);
    expect(page.rightSide()).toBeNull();

    let resolveStale: (record: AthleteRecord | null) => void = vi.fn();

    loadRecord.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveStale = resolve;
        }),
    );
    routeStub.setParams({ [LEFT_ROUTE_PARAM]: UNKNOWN_KEY });

    expect(page.duelStatus(), 'a param change restarts the duel load').toBe(DuelStatus.loading);

    routeStub.setParams({ [LEFT_ROUTE_PARAM]: LEFT_KEY, [RIGHT_ROUTE_PARAM]: RIGHT_KEY });
    await settle();

    expect(page.duelStatus()).toBe(DuelStatus.ready);

    resolveStale(null);
    await settle();

    expect(page.duelStatus(), 'the stale notFound must not override the newer duel').toBe(DuelStatus.ready);
    expect(page.leftSide()).toEqual(EXPECTED_LEFT_SIDE);

    routeStub.setParams({ [LEFT_ROUTE_PARAM]: ' ', [RIGHT_ROUTE_PARAM]: RIGHT_KEY });
    await settle();

    expect(page.duelStatus(), 'a blank first key leaves a half-filled idle picker').toBe(DuelStatus.idle);
    expect(page.leftSide()).toBeNull();
    expect(page.rightSide()?.key).toBe(RIGHT_KEY);
  });

  it('reports an unknown athlete with a reset link, and the error states of both loads', async () => {
    routeParams[LEFT_ROUTE_PARAM] = LEFT_KEY;
    routeParams[RIGHT_ROUTE_PARAM] = UNKNOWN_KEY;
    fixture = await createPage();

    expect(fixture.componentInstance.duelStatus()).toBe(DuelStatus.notFound);
    expect(fixture.componentInstance.leftSide(), 'a notFound pair renders no slots').toBeNull();

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.versus__reset-link').getAttribute('href')).toBe(VERSUS_PAGE_LINK);

    fixture.destroy();
    loadRecords.mockRejectedValue(new Error(VERSUS_LOAD_ERROR_MESSAGE));
    loadRecord.mockRejectedValue(new Error(VERSUS_LOAD_ERROR_MESSAGE));
    fixture = await createPage();

    const page = fixture.componentInstance;

    expect(page.status()).toBe(VersusStatus.error);
    expect(page.duelStatus()).toBe(DuelStatus.error);

    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.versus__error').length, 'both error notes render').toBe(2);
  });

  it('prefills the bare picker with the picked self once, via a replaceUrl redirect', async () => {
    selfSignal.set(VERSUS_SELF_PICK);

    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);

    fixture = await createPage();

    expect(navigate).toHaveBeenCalledExactlyOnceWith([VERSUS_PAGE_LINK, LEFT_KEY], { replaceUrl: true });

    routeStub.setParams({ [LEFT_ROUTE_PARAM]: LEFT_KEY });
    await settle();

    const page = fixture.componentInstance;

    expect(page.leftSide()?.key).toBe(LEFT_KEY);
    expect(page.duelStatus(), 'the prefilled slot waits for an opponent').toBe(DuelStatus.idle);

    page.clearLeft();
    routeStub.setParams({});
    await settle();

    expect(navigate).toHaveBeenCalledWith([VERSUS_PAGE_LINK]);
    expect(page.leftSide(), 'clearing sticks — the prefill fires only on the first arrival').toBeNull();
    expect(page.duelStatus()).toBe(DuelStatus.idle);
  });

  it('does not fetch the directory during prerender and keeps the loading state for hydration', async () => {
    platformId = SERVER_PLATFORM_ID;
    fixture = await createPage();

    expect(loadRecords).not.toHaveBeenCalled();
    expect(fixture.componentInstance.status()).toBe(VersusStatus.loading);
  });
});

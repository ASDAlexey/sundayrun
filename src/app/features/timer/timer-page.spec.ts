import { PLATFORM_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { vi } from 'vitest';

import { COMPLETE_SESSION } from '../../core/timer/session-splits.mock';
import { TimerStatus } from '../../core/timer/timer-session.enum';
import { TimerSession } from '../../core/timer/timer-session.interface';
import { TIMER_SESSION, TIMER_SESSION_ID, TIMER_SESSION_IDLE } from '../../core/timer/timer-session.mock';
import { AdminTokenService } from '../../github/admin-token.service';
import { ShareService } from '../../share/share.service';
import { HapticsService } from '../../state/haptics.service';
import { HapticsServiceMock, hapticsServiceMock } from '../../state/haptics.service.mock';
import { RaceGuardService } from '../../state/race-guard.service';
import { RaceGuardServiceMock, raceGuardServiceMock } from '../../state/race-guard.service.mock';
import { TimerClockService } from '../../state/timer-clock.service';
import { TimerClockServiceMock, timerClockServiceMock } from '../../state/timer-clock.service.mock';
import { TimerPublishService } from '../../state/timer-publish.service';
import { TimerPublishServiceMock, timerPublishServiceMock } from '../../state/timer-publish.service.mock';
import { TimerRosterService } from '../../state/timer-roster.service';
import { TimerRosterServiceMock, timerRosterServiceMock } from '../../state/timer-roster.service.mock';
import { TimerSessionService } from '../../state/timer-session.service';
import { TimerSessionServiceMock, timerSessionServiceMock } from '../../state/timer-session.service.mock';
import { BROWSER_PLATFORM_ID, SERVER_PLATFORM_ID } from '../spec-utils/platform.mock';
import {
  GRID_PLAIN_RUNNERS,
  GRID_PLAIN_RUNNING,
  GRID_PLAIN_SESSION,
  GRID_TAP_TIME_TEXT,
  PLAIN_LEADER_ID,
} from './runner-grid/runner-grid.mock';
import { TILE_DOWN, TILE_UP_LONG, tilePointerEvent } from './runner-tile/runner-tile.mock';
import { WakeLockService } from '../../state/wake-lock.service';
import { wakeLockServiceMock } from '../../state/wake-lock.service.mock';
import { TimerFarewellService } from './timer-farewell.service';
import { TimerFarewellServiceMock, timerFarewellServiceMock } from './timer-farewell.service.mock';
import { TimerPage } from './timer-page';
import {
  FAREWELL_BEST_TEXT,
  PAGE_UNNAMED_SPLIT_ID,
  TIMER_HEADER_RUNNING,
  TIMER_PAGE_FINISHED,
  TIMER_PAGE_QUEUE,
  TIMER_RESET_NOTE,
} from './timer-page.mock';

describe('TimerPage', () => {
  const isAdmin = signal(true);

  let fixture: ComponentFixture<TimerPage>;
  let sessions: TimerSessionServiceMock;
  let roster: TimerRosterServiceMock;
  let clock: TimerClockServiceMock;
  let publish: TimerPublishServiceMock;
  let haptics: HapticsServiceMock;
  let raceGuard: RaceGuardServiceMock;
  let farewell: TimerFarewellServiceMock;
  let platformId: string;

  const element = (): HTMLElement => fixture.nativeElement;
  const click = (selector: string): void => element().querySelector<HTMLElement>(selector)?.click();
  const textOf = (selector: string): (string | undefined)[] =>
    [...element().querySelectorAll(selector)].map((node) => node.textContent?.trim());

  const create = async (): Promise<void> => {
    fixture = TestBed.createComponent(TimerPage);
    await fixture.whenStable();
  };

  /** Runs the newest pure change the screen handed to the store against a session of our choosing. */
  const applyLastChange = (session: TimerSession): TimerSession => {
    const calls = sessions.updateActive.mock.calls;

    return calls[calls.length - 1][0](session);
  };

  const menuItem = (index: number): void => {
    element().querySelectorAll<HTMLElement>('.timer__menu-item')[index].click();
  };

  const confirmDialog = (): HTMLDialogElement | null => element().querySelector('dialog.timer-confirm');

  beforeEach(() => {
    vi.clearAllMocks();
    isAdmin.set(true);
    platformId = BROWSER_PLATFORM_ID;
    sessions = timerSessionServiceMock();
    roster = timerRosterServiceMock();
    clock = timerClockServiceMock();
    publish = timerPublishServiceMock();
    haptics = hapticsServiceMock();
    raceGuard = raceGuardServiceMock();
    farewell = timerFarewellServiceMock();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: TimerSessionService, useValue: sessions },
        { provide: TimerRosterService, useValue: roster },
        { provide: TimerClockService, useValue: clock },
        { provide: TimerPublishService, useValue: publish },
        { provide: HapticsService, useValue: haptics },
        { provide: RaceGuardService, useValue: raceGuard },
        { provide: TimerFarewellService, useValue: farewell },
        { provide: WakeLockService, useValue: wakeLockServiceMock() },
        { provide: AdminTokenService, useValue: { isAdmin } },
        { provide: ShareService, useValue: { canShareFile: vi.fn(() => false), shareFile: vi.fn() } },
        { provide: PLATFORM_ID, useFactory: () => platformId },
        // The empty state carries the install hint, whose readiness badge asks the worker channel.
        { provide: SwUpdate, useValue: { isEnabled: false } },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('is «Мои замеры» while nothing is open, and reopens the measurement the visitor picks', async () => {
    sessions.sessions.set([TIMER_SESSION]);
    await create();

    expect(element().querySelector('.timer__title')?.textContent?.trim()).not.toBe('');
    expect(element().querySelector('app-timer-sessions'), 'the list owns the invitation and the «Новый забег» key').not.toBeNull();
    expect(element().querySelector('.timer_race'), 'the cockpit stays out of the way until it is needed').toBeNull();
    expect(roster.load, 'the directory warms up as soon as the route opens').toHaveBeenCalledOnce();

    click('.timer-sessions__menu');
    await fixture.whenStable();
    click('.timer-sessions__menu-item');

    expect(sessions.open).toHaveBeenCalledExactlyOnceWith(TIMER_SESSION_ID);
  });

  it('leaves the directory alone during a prerender', async () => {
    platformId = SERVER_PLATFORM_ID;
    await create();

    expect(roster.load).not.toHaveBeenCalled();
  });

  it('marks the open race, counts the three tabs and drops the last split from the top bar', async () => {
    sessions.active.set(TIMER_SESSION);
    await create();

    expect(element().querySelector('.timer__marking')?.textContent).toContain(TIMER_HEADER_RUNNING.dateText);
    expect(textOf('.timer__tab-count')).toEqual([
      String(TIMER_HEADER_RUNNING.runnerCount),
      String(TIMER_HEADER_RUNNING.lapCount),
      String(TIMER_HEADER_RUNNING.finishCount),
    ]);
    expect(element().querySelector('.timer__undo_armed')).not.toBeNull();

    click('.timer__undo');

    expect(applyLastChange(TIMER_SESSION).splits.length).toBe(TIMER_SESSION.splits.length - 1);

    sessions.active.set(TIMER_PAGE_FINISHED);
    await fixture.whenStable();
    click('.timer__undo');

    const resumed = applyLastChange(TIMER_PAGE_FINISHED);

    expect(resumed.status, 'undo takes the automatic stop back with the tap that caused it').toBe(TimerStatus.running);
    expect(resumed.stoppedAtMs).toBeNull();

    raceGuard.confirmLeave.mockReturnValue(false);
    click('.timer__back');

    expect(sessions.closeActive, 'the one visible exit asks first while the clock runs').not.toHaveBeenCalled();

    raceGuard.confirmLeave.mockReturnValue(true);
    click('.timer__back');

    expect(sessions.closeActive).toHaveBeenCalledOnce();
  });

  it('waves the tiles out when the last runner is home and brings the protocol up behind them', async () => {
    sessions.active.set(COMPLETE_SESSION);
    farewell.waving.set(true);
    await create();

    expect(element().querySelector('.timer-grid_farewell'), 'the tiles go out from the top row down').not.toBeNull();
    expect(element().querySelector('app-timer-grid'), 'and the grid stays on screen while they do').not.toBeNull();

    farewell.waving.set(false);
    farewell.settled.set(true);
    await fixture.whenStable();

    expect(element().querySelector('app-timer-finish-board'), 'then the protocol comes up by itself').not.toBeNull();
    expect(element().querySelector('.timer-clock__summary')?.textContent).toContain(FAREWELL_BEST_TEXT);

    click('.timer__tabs .timer__tab:nth-child(1)');
    await fixture.whenStable();

    expect(element().querySelector('app-timer-grid'), 'and the tiles are still one tap away').not.toBeNull();
  });

  it('switches between the grid and the two boards, and opens the journal over them', async () => {
    sessions.active.set(TIMER_SESSION);
    await create();

    expect(element().querySelector('app-timer-grid')).not.toBeNull();

    click('.timer__tabs .timer__tab:nth-child(2)');
    await fixture.whenStable();

    expect(element().querySelector('app-timer-grid')).toBeNull();
    expect(element().querySelector('.timer-lap-board__row'), 'the live lap table is the tab itself').not.toBeNull();

    click('.timer__tabs .timer__tab:nth-child(3)');
    await fixture.whenStable();

    expect(element().querySelectorAll('.timer__tab_on').length, 'exactly one filter is on').toBe(1);
    expect(element().querySelector('.timer-finish-board__row'), 'and «Финиш» is the protocol as it will go to the site').not.toBeNull();

    click('.timer__menu');
    await fixture.whenStable();
    menuItem(2);
    await fixture.whenStable();

    expect(element().querySelector('app-timer-history'), 'the journal is reachable, not «скоро»').not.toBeNull();
    expect(element().querySelector('app-timer-finish-board'), 'and it takes the whole tab area').toBeNull();

    click('.timer-history__close');
    await fixture.whenStable();

    expect(element().querySelector('app-timer-finish-board')).not.toBeNull();
  });

  it('arms the click from the menu and opens the roster sheet from it', async () => {
    sessions.active.set(TIMER_SESSION_IDLE);
    await create();

    click('.timer__menu');
    await fixture.whenStable();

    expect(element().querySelector('.timer__menu-panel')).not.toBeNull();
    expect(element().querySelector('.timer__menu-toggle'), 'the grid tightens itself — the menu offers no density any more').toBeNull();

    expect(
      element().querySelectorAll('.timer__menu-item')[0].getAttribute('aria-pressed'),
      'the click is off out of the box — a park is not where everybody wants sound',
    ).toBe('false');
    expect(textOf('.timer__menu-state')[0], 'and the item says so in words').toBe('выкл');

    menuItem(0);
    haptics.soundEnabled.set(true);
    await fixture.whenStable();

    expect(haptics.toggleSound, 'the click is armed from the one gesture that is not a split').toHaveBeenCalledOnce();
    expect(element().querySelectorAll('.timer__menu-item')[0].getAttribute('aria-pressed')).toBe('true');
    expect(textOf('.timer__menu-state')[0]).toBe('вкл');

    menuItem(1);
    await fixture.whenStable();

    expect(element().querySelector('app-timer-picker'), 'the roster sheet is reachable mid-race too').not.toBeNull();
    expect(element().querySelector('.timer__menu-panel'), 'and the menu closes behind it').toBeNull();
  });

  it('spells out what a reset costs, and wipes the times only when the question is answered', async () => {
    sessions.active.set(TIMER_SESSION);
    await create();

    click('.timer__menu');
    await fixture.whenStable();
    click('.timer__menu-item_danger');
    await fixture.whenStable();

    expect(confirmDialog()?.querySelector('.timer-confirm__note')?.textContent).toBe(TIMER_RESET_NOTE);

    confirmDialog()?.querySelector<HTMLElement>('.timer-confirm__cancel')?.click();
    await fixture.whenStable();

    expect(sessions.updateActive, '«Отмена» leaves the race running').not.toHaveBeenCalled();

    click('.timer__menu-item_danger');
    await fixture.whenStable();
    confirmDialog()?.querySelector<HTMLElement>('.timer-confirm__action')?.click();
    await fixture.whenStable();

    const reset = applyLastChange(TIMER_SESSION);

    expect(reset.status).toBe(TimerStatus.idle);
    expect(reset.splits).toEqual([]);
    expect(reset.runners, 'the people who came stay on the roster').toBe(TIMER_SESSION.runners);
    expect(element().querySelector('.timer__menu-panel'), 'the menu closes behind the reset').toBeNull();
  });

  it('opens the runner card on a long press and closes it again', async () => {
    sessions.active.set(GRID_PLAIN_RUNNING);
    await create();

    const tile = element().querySelector('.timer-tile');

    tile?.dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN));
    tile?.dispatchEvent(tilePointerEvent('pointerup', TILE_UP_LONG));
    await fixture.whenStable();

    expect(element().querySelector('.timer-runner-card__name')?.textContent?.trim()).toBe(GRID_PLAIN_RUNNERS[0].fullName);

    click('.timer-runner-card__close');
    await fixture.whenStable();

    expect(element().querySelector('app-timer-runner-card')).toBeNull();
  });

  it('walks a whole measurement: roster, start, cuts, the nameless queue, stop and «Сохранить»', async () => {
    sessions.active.set(GRID_PLAIN_SESSION);
    await create();

    click('.timer__roster');
    await fixture.whenStable();

    expect(element().querySelector('app-timer-picker'), 'before the start the roster shares the panel with the keys').not.toBeNull();

    click('.timer-picker__scrim');
    await fixture.whenStable();

    expect(element().querySelector('app-timer-picker')).toBeNull();

    click('.timer-clock__control');

    expect(clock.start, '«Старт» runs the clock at once').toHaveBeenCalledOnce();

    sessions.active.set(GRID_PLAIN_RUNNING);
    await fixture.whenStable();

    const tile = element().querySelector('.timer-tile');

    tile?.dispatchEvent(tilePointerEvent('pointerdown', TILE_DOWN));
    await fixture.whenStable();

    const announced = element().querySelector('.timer__announcer')?.textContent;

    expect(announced).toContain(GRID_PLAIN_RUNNERS[0].fullName);
    expect(announced).toContain(GRID_TAP_TIME_TEXT);

    element()
      .querySelector('.timer-tape__cut')
      ?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

    expect(applyLastChange(GRID_PLAIN_RUNNING).splits.at(-1)?.runnerId, '«Отсечка» writes a time with no name on it').toBeNull();

    sessions.active.set(TIMER_PAGE_QUEUE);
    click('.timer__tabs .timer__tab:nth-child(3)');
    await fixture.whenStable();

    // «Разобрать финиш»: the second key of the pair, and the only man in that half is the one who
    // already has his lap — the other two are still waiting for theirs and are not in this list.
    click('.timer-tape__modes .timer-tape__toggle:nth-child(2)');
    await fixture.whenStable();

    expect(element().querySelector('.timer-tape__panel')).not.toBeNull();
    expect(element().querySelector('app-timer-grid'), 'a queue is handed out by tapping surnames, so the tiles come back').not.toBeNull();
    expect(textOf('.timer-tape__runner-name')).toEqual([GRID_PLAIN_RUNNERS[0].fullName]);

    click('.timer-tape__runner');

    expect(applyLastChange(TIMER_PAGE_QUEUE).splits.find((split) => split.id === PAGE_UNNAMED_SPLIT_ID)?.runnerId).toBe(PLAIN_LEADER_ID);

    click('.timer-tape__modes .timer-tape__toggle:nth-child(2)');
    await fixture.whenStable();

    expect(element().querySelector('.timer-tape__panel'), 'and the panel gives the grid its row back').toBeNull();

    click('.timer-clock__control_stop');

    expect(clock.stop).toHaveBeenCalledOnce();

    sessions.active.set(TIMER_PAGE_FINISHED);
    await fixture.whenStable();

    expect(element().querySelector('app-timer-publish'), '«Сохранить» appears only once the clock is stopped').not.toBeNull();

    click('.timer-publish__save');

    expect(publish.publish).toHaveBeenCalledExactlyOnceWith(TIMER_PAGE_FINISHED);

    click('.timer-publish__unnamed-resolve');
    await fixture.whenStable();

    expect(element().querySelector('.timer-tape__panel'), '«Разобрать» takes the organiser to the queue itself').not.toBeNull();
  });
});

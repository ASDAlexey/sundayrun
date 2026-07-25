import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TIMER_SESSION, TIMER_SESSION_FINISHED } from '../core/timer/timer-session.mock';
import { settle } from '../features/spec-utils/settle';
import { BEFORE_UNLOAD_EVENT, TIMER_LEAVE_CONFIRM } from './race-guard.constant';
import { RaceGuardService } from './race-guard.service';
import { TimerSessionService } from './timer-session.service';
import { timerSessionServiceMock } from './timer-session.service.mock';

describe('RaceGuardService', () => {
  const sessions = timerSessionServiceMock();
  const confirm = vi.fn(() => true);
  const addEventListener = vi.fn();
  const removeEventListener = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    confirm.mockReturnValue(true);
    sessions.active.set(null);
    TestBed.configureTestingModule({
      providers: [
        { provide: TimerSessionService, useValue: sessions },
        { provide: DOCUMENT, useValue: { defaultView: { addEventListener, confirm, removeEventListener } } },
      ],
    });
  });

  it('asks before a running race is left, and holds the tab back only while it runs', async () => {
    const service = TestBed.inject(RaceGuardService);

    await settle();

    expect(service.confirmLeave(), 'nothing is open, so nothing is at stake').toBe(true);
    expect(addEventListener).not.toHaveBeenCalled();

    sessions.active.set(TIMER_SESSION);
    await settle();

    expect(addEventListener.mock.calls[0][0]).toBe(BEFORE_UNLOAD_EVENT);
    expect(service.confirmLeave()).toBe(true);
    expect(confirm).toHaveBeenCalledExactlyOnceWith(TIMER_LEAVE_CONFIRM);

    confirm.mockReturnValue(false);

    expect(service.confirmLeave(), 'the organiser stayed').toBe(false);

    // The listener runs for real, so the browser's own dialog is what the closing tab gets.
    const preventDefault = vi.fn();

    addEventListener.mock.calls[0][1]({ preventDefault });

    expect(preventDefault).toHaveBeenCalledOnce();

    sessions.active.set(TIMER_SESSION_FINISHED);
    await settle();

    expect(removeEventListener, 'a stopped clock has no reason to hold a tab').toHaveBeenCalledOnce();
    expect(service.confirmLeave()).toBe(true);
  });
});

describe('RaceGuardService during a prerender', () => {
  const sessions = timerSessionServiceMock();

  beforeEach(() => {
    sessions.active.set(TIMER_SESSION);
    TestBed.configureTestingModule({
      providers: [
        { provide: TimerSessionService, useValue: sessions },
        { provide: DOCUMENT, useValue: { defaultView: null } },
      ],
    });
  });

  it('lets everything through without a window to ask', () => {
    expect(TestBed.inject(RaceGuardService).confirmLeave()).toBe(true);
  });
});

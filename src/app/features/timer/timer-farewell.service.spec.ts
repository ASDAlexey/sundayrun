import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { COMPLETE_SESSION } from '../../core/timer/session-splits.mock';
import { TIMER_SESSION } from '../../core/timer/timer-session.mock';
import { TimerSessionService } from '../../state/timer-session.service';
import { timerSessionServiceMock } from '../../state/timer-session.service.mock';
import { settle } from '../spec-utils/settle';
import { TIMER_FAREWELL_WAVE_MS } from './timer-farewell.constant';
import { TimerFarewellService } from './timer-farewell.service';
import { COMPLETE_SESSION_TOUCHED, FAREWELL_WAVE_TIMEOUT_ID } from './timer-farewell.service.mock';

describe('TimerFarewellService', () => {
  const sessions = timerSessionServiceMock();
  const matchMedia = vi.fn(() => ({ matches: false }));
  const setTimeout = vi.fn((_handler: () => void, _delayMs: number) => FAREWELL_WAVE_TIMEOUT_ID);
  const clearTimeout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    matchMedia.mockReturnValue({ matches: false });
    sessions.active.set(null);
    TestBed.configureTestingModule({
      providers: [
        { provide: TimerSessionService, useValue: sessions },
        { provide: DOCUMENT, useValue: { defaultView: { clearTimeout, matchMedia, setTimeout } } },
      ],
    });
  });

  it('waves the tiles out when the last runner is home and hands the screen to the protocol', async () => {
    const service = TestBed.inject(TimerFarewellService);

    await settle();

    expect(service.waving()).toBe(false);

    sessions.active.set(TIMER_SESSION);
    await settle();

    expect(service.waving(), 'Попов Игорь is still out on the course').toBe(false);

    sessions.active.set(COMPLETE_SESSION);
    await settle();

    expect(service.waving()).toBe(true);
    expect(service.settled(), 'the protocol waits for the wave to finish').toBe(false);
    expect(setTimeout).toHaveBeenCalledExactlyOnceWith(expect.any(Function), TIMER_FAREWELL_WAVE_MS);

    sessions.active.set(COMPLETE_SESSION_TOUCHED);
    await settle();

    expect(setTimeout, 'a further edit of a finished race does not replay the ceremony').toHaveBeenCalledOnce();

    setTimeout.mock.calls[0][0]();

    expect(service.settled()).toBe(true);
    expect(service.waving()).toBe(false);

    sessions.active.set(TIMER_SESSION);
    await settle();

    expect(service.settled(), 'an undone finish puts the race back in progress').toBe(false);
    expect(clearTimeout).toHaveBeenCalledExactlyOnceWith(FAREWELL_WAVE_TIMEOUT_ID);

    sessions.active.set(COMPLETE_SESSION);
    await settle();

    expect(service.waving(), 'and the ceremony is armed again with it').toBe(true);

    service.ngOnDestroy();

    expect(service.waving()).toBe(false);
  });

  it('gives the protocol straight away when the system was asked for less motion', async () => {
    matchMedia.mockReturnValue({ matches: true });
    sessions.active.set(COMPLETE_SESSION);

    const service = TestBed.inject(TimerFarewellService);

    await settle();

    expect(service.settled(), 'without motion there is nothing left of the transition to play').toBe(true);
    expect(setTimeout).not.toHaveBeenCalled();
  });
});

describe('TimerFarewellService during a prerender', () => {
  const sessions = timerSessionServiceMock();

  beforeEach(() => {
    sessions.active.set(COMPLETE_SESSION);
    TestBed.configureTestingModule({
      providers: [
        { provide: TimerSessionService, useValue: sessions },
        { provide: DOCUMENT, useValue: { defaultView: null } },
      ],
    });
  });

  it('settles without a window to schedule the wave on', async () => {
    const service = TestBed.inject(TimerFarewellService);

    await settle();

    expect(service.settled()).toBe(true);
  });
});

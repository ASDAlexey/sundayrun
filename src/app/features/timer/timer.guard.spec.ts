import { TestBed } from '@angular/core/testing';

import { RaceGuardService } from '../../state/race-guard.service';
import { RaceGuardServiceMock, raceGuardServiceMock } from '../../state/race-guard.service.mock';
import { TIMER_GUARD_PAGE, TIMER_GUARD_ROUTE, TIMER_GUARD_STATE } from './timer.guard.mock';
import { timerLeaveGuard } from './timer.guard';

describe('timerLeaveGuard', () => {
  let guard: RaceGuardServiceMock;

  const leave = (): boolean | unknown =>
    TestBed.runInInjectionContext(() => timerLeaveGuard(TIMER_GUARD_PAGE, TIMER_GUARD_ROUTE, TIMER_GUARD_STATE, TIMER_GUARD_STATE));

  beforeEach(() => {
    guard = raceGuardServiceMock();
    TestBed.configureTestingModule({ providers: [{ provide: RaceGuardService, useValue: guard }] });
  });

  it('lets the route go only when the race screen says it may', () => {
    expect(leave()).toBe(true);

    guard.confirmLeave.mockReturnValue(false);

    expect(leave(), 'the system «назад» is the invisible exit and gets the same question').toBe(false);
  });
});

import { inject } from '@angular/core';
import { type CanDeactivateFn } from '@angular/router';

import { RaceGuardService } from '../../state/race-guard.service';
import { type TimerPage } from './timer-page';

/** Leaving /timer mid-race costs the splits nobody can take again, so it is asked about first. */
export const timerLeaveGuard: CanDeactivateFn<TimerPage> = () => inject(RaceGuardService).confirmLeave();

import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { TimerPage } from './timer-page';

/** The guard asks the service and nothing else, so bare prototype instances are enough. */
export const TIMER_GUARD_PAGE: TimerPage = Object.create(TimerPage.prototype);

export const TIMER_GUARD_ROUTE: ActivatedRouteSnapshot = Object.create(ActivatedRouteSnapshot.prototype);

export const TIMER_GUARD_STATE: RouterStateSnapshot = Object.create(RouterStateSnapshot.prototype);

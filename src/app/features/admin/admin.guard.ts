import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AdminTokenService } from '../../github/admin-token.service';
import { HOME_ROUTE_COMMANDS } from './admin.guard.constant';

/** Allows the publish wizard only in admin mode (a stored GitHub token); otherwise returns to the race list. */
export const adminGuard: CanActivateFn = () =>
  inject(AdminTokenService).isAdmin() ? true : inject(Router).createUrlTree(HOME_ROUTE_COMMANDS);

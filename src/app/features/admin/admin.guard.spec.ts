import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AdminTokenService } from '../../github/admin-token.service';
import { GUARD_ROUTE_SNAPSHOT, GUARD_STATE_SNAPSHOT } from '../preview/preview.guard.mock';
import { adminGuard } from './admin.guard';
import { HOME_ROUTE_COMMANDS } from './admin.guard.constant';
import { HOME_URL_TREE } from './admin.guard.mock';

describe('adminGuard', () => {
  const isAdmin = signal(false);
  const createUrlTree = vi.fn(() => HOME_URL_TREE);

  beforeEach(() => {
    isAdmin.set(false);
    createUrlTree.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: AdminTokenService, useValue: { isAdmin } },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });
  });

  it('redirects visitors to the race list and allows activation in admin mode', () => {
    const redirect = TestBed.runInInjectionContext(() => adminGuard(GUARD_ROUTE_SNAPSHOT, GUARD_STATE_SNAPSHOT));

    expect(redirect).toBe(HOME_URL_TREE);
    expect(createUrlTree).toHaveBeenCalledWith(HOME_ROUTE_COMMANDS);

    isAdmin.set(true);

    expect(TestBed.runInInjectionContext(() => adminGuard(GUARD_ROUTE_SNAPSHOT, GUARD_STATE_SNAPSHOT))).toBe(true);
    expect(createUrlTree).toHaveBeenCalledTimes(1);
  });
});

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ProtocolStateService } from '../../state/protocol-state.service';
import { GUARD_ROUTE_SNAPSHOT, GUARD_STATE_SNAPSHOT } from '../preview/preview.guard.mock';
import { resultGuard } from './result.guard';
import { PREVIEW_ROUTE_COMMANDS } from './result.guard.constant';
import { PREVIEW_URL_TREE } from './result.guard.mock';

describe('resultGuard', () => {
  const canGenerate = signal(false);
  const createUrlTree = vi.fn(() => PREVIEW_URL_TREE);

  beforeEach(() => {
    canGenerate.set(false);
    createUrlTree.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: ProtocolStateService, useValue: { canGenerate } },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });
  });

  it('redirects to /preview while generation is unavailable and allows activation once ready', () => {
    const redirect = TestBed.runInInjectionContext(() => resultGuard(GUARD_ROUTE_SNAPSHOT, GUARD_STATE_SNAPSHOT));

    expect(redirect).toBe(PREVIEW_URL_TREE);
    expect(createUrlTree).toHaveBeenCalledWith(PREVIEW_ROUTE_COMMANDS);

    canGenerate.set(true);

    expect(TestBed.runInInjectionContext(() => resultGuard(GUARD_ROUTE_SNAPSHOT, GUARD_STATE_SNAPSHOT))).toBe(true);
    expect(createUrlTree).toHaveBeenCalledTimes(1);
  });
});

import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ProtocolStateService } from '../../state/protocol-state.service';
import { previewGuard } from './preview.guard';
import { UPLOAD_ROUTE_COMMANDS } from './preview.guard.constant';
import { GUARD_ROUTE_SNAPSHOT, GUARD_STATE_SNAPSHOT, UPLOAD_URL_TREE } from './preview.guard.mock';

describe('previewGuard', () => {
  const hasParticipants = signal(false);
  const createUrlTree = vi.fn(() => UPLOAD_URL_TREE);

  beforeEach(() => {
    hasParticipants.set(false);
    createUrlTree.mockClear();
    TestBed.configureTestingModule({
      providers: [
        { provide: ProtocolStateService, useValue: { hasParticipants } },
        { provide: Router, useValue: { createUrlTree } },
      ],
    });
  });

  it('redirects to /upload without participants and allows activation with them', () => {
    const redirect = TestBed.runInInjectionContext(() => previewGuard(GUARD_ROUTE_SNAPSHOT, GUARD_STATE_SNAPSHOT));

    expect(redirect).toBe(UPLOAD_URL_TREE);
    expect(createUrlTree).toHaveBeenCalledWith(UPLOAD_ROUTE_COMMANDS);

    hasParticipants.set(true);

    expect(TestBed.runInInjectionContext(() => previewGuard(GUARD_ROUTE_SNAPSHOT, GUARD_STATE_SNAPSHOT))).toBe(true);
    expect(createUrlTree).toHaveBeenCalledTimes(1);
  });
});

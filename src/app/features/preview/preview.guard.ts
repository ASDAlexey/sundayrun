import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ProtocolStateService } from '../../state/protocol-state.service';
import { UPLOAD_ROUTE_COMMANDS } from './preview.guard.constant';

/** Allows /preview only when a file is imported; otherwise redirects to /upload. */
export const previewGuard: CanActivateFn = () =>
  inject(ProtocolStateService).hasParticipants() ? true : inject(Router).createUrlTree(UPLOAD_ROUTE_COMMANDS);

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ProtocolStateService } from '../../state/protocol-state.service';
import { PREVIEW_ROUTE_COMMANDS } from './result.guard.constant';

/** Allows /result only when the protocol is ready to generate; otherwise returns to /preview. */
export const resultGuard: CanActivateFn = () =>
  inject(ProtocolStateService).canGenerate() ? true : inject(Router).createUrlTree(PREVIEW_ROUTE_COMMANDS);

import { VersionEvent } from '@angular/service-worker';
import { Mock, vi } from 'vitest';
import { Observable, Subject } from 'rxjs';

import { VERSION_READY_EVENT } from './app-update.constant';

/** The subset of `SwUpdate` the gate uses: one flag, one stream, one spied call. */
export interface SwUpdateMock {
  isEnabled: boolean;
  versionUpdates: Observable<VersionEvent>;
  activateUpdate: Mock;
}

/** A stubbed worker channel; the spec pushes its own events into `versionUpdates`. */
export function swUpdateMock(): SwUpdateMock {
  return {
    isEnabled: true,
    versionUpdates: new Subject<VersionEvent>(),
    activateUpdate: vi.fn(),
  };
}

/** The hash of the build waiting to be activated; only its presence matters here. */
export const NEXT_VERSION_HASH = 'a1b2c3d4';

/** The event that says a new build is downloaded and ready. */
export const VERSION_READY_EVENT_FIXTURE: VersionEvent = {
  type: VERSION_READY_EVENT,
  currentVersion: { hash: NEXT_VERSION_HASH },
  latestVersion: { hash: NEXT_VERSION_HASH },
};

/** The routine «checked, nothing new» event the gate must ignore. */
export const NO_NEW_VERSION_EVENT: VersionEvent = {
  type: 'NO_NEW_VERSION_DETECTED',
  version: { hash: NEXT_VERSION_HASH },
};

/** What a refused activation rejects with. */
export const UPDATE_ACTIVATION_ERROR_MESSAGE = 'обновление не применилось';

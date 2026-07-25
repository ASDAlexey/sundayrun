import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';

import { TIMER_SESSION, TIMER_SESSION_FINISHED } from '../core/timer/timer-session.mock';
import { settle } from '../features/spec-utils/settle';
import { AppUpdateService } from './app-update.service';
import {
  NO_NEW_VERSION_EVENT,
  UPDATE_ACTIVATION_ERROR_MESSAGE,
  VERSION_READY_EVENT_FIXTURE,
  swUpdateMock,
} from './app-update.service.mock';
import { TimerSessionService } from './timer-session.service';
import { timerSessionServiceMock } from './timer-session.service.mock';

describe('AppUpdateService', () => {
  const sessions = timerSessionServiceMock();
  const swUpdate = swUpdateMock();
  const reload = vi.fn();

  let versionUpdates = new Subject<VersionEvent>();

  beforeEach(() => {
    versionUpdates = new Subject<VersionEvent>();
    sessions.active.set(null);
    reload.mockClear();
    swUpdate.isEnabled = true;
    swUpdate.activateUpdate.mockClear();
    swUpdate.activateUpdate.mockResolvedValue(true);
    swUpdate.versionUpdates = versionUpdates;
    TestBed.configureTestingModule({
      providers: [
        { provide: SwUpdate, useValue: swUpdate },
        { provide: TimerSessionService, useValue: sessions },
        { provide: DOCUMENT, useValue: { defaultView: { location: { reload } } } },
      ],
    });
  });

  afterEach(() => {
    versionUpdates.complete();
  });

  it('holds a new release back while the race runs and applies it the moment the clock stops', async () => {
    sessions.active.set(TIMER_SESSION);
    TestBed.inject(AppUpdateService);

    versionUpdates.next(NO_NEW_VERSION_EVENT);
    await settle();

    expect(swUpdate.activateUpdate, 'a check that found nothing changes nothing').not.toHaveBeenCalled();

    versionUpdates.next(VERSION_READY_EVENT_FIXTURE);
    await settle();

    expect(swUpdate.activateUpdate, 'reloading mid-race would cost splits nobody can take again').not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();

    sessions.active.set(TIMER_SESSION_FINISHED);
    await settle();

    expect(swUpdate.activateUpdate, 'the race is over, so the waiting version lands').toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('applies a release straight away when no measurement is open, and survives a failed activation', async () => {
    swUpdate.activateUpdate.mockRejectedValue(new Error(UPDATE_ACTIVATION_ERROR_MESSAGE));
    TestBed.inject(AppUpdateService);

    versionUpdates.next(VERSION_READY_EVENT_FIXTURE);
    await settle();

    expect(swUpdate.activateUpdate).toHaveBeenCalledOnce();
    expect(reload, 'a failed activation leaves the tab on the version it already has').not.toHaveBeenCalled();
  });

  it('does nothing at all without a registered worker', async () => {
    swUpdate.isEnabled = false;
    TestBed.inject(AppUpdateService);

    versionUpdates.next(VERSION_READY_EVENT_FIXTURE);
    await settle();

    expect(swUpdate.activateUpdate).not.toHaveBeenCalled();
  });
});

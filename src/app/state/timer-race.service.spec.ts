import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { COMPLETE_SESSION } from '../core/timer/session-splits.mock';
import { TimerStatus } from '../core/timer/timer-session.enum';
import { TIMER_SESSION, TIMER_SESSION_IDLE } from '../core/timer/timer-session.mock';
import { settle } from '../features/spec-utils/settle';
import { TimerFeedback } from './haptics.enum';
import { HapticsService } from './haptics.service';
import { HapticsServiceMock, hapticsServiceMock } from './haptics.service.mock';
import { TimerClockService } from './timer-clock.service';
import { TimerClockServiceMock, timerClockServiceMock } from './timer-clock.service.mock';
import { TIMER_CLOCK_IDLE_MS } from './timer-clock.constant';
import {
  RACE_ELAPSED_MS,
  RACE_EMPTY_SESSION,
  RACE_EXPECTED_LAP_MS,
  RACE_FROZEN_TILE_ORDER,
  RACE_FINISHED_SESSION,
  RACE_RUNNING_AGAIN,
  RACE_START_EPOCH_MS,
} from './timer-race.service.mock';
import { TimerRaceService } from './timer-race.service';
import { TimerRosterService } from './timer-roster.service';
import { TimerRosterServiceMock, timerRosterServiceMock } from './timer-roster.service.mock';
import { TimerSessionService } from './timer-session.service';
import { TimerSessionServiceMock, timerSessionServiceMock } from './timer-session.service.mock';
import { WakeLockService } from './wake-lock.service';
import { WakeLockServiceMock, wakeLockServiceMock } from './wake-lock.service.mock';

describe('TimerRaceService', () => {
  let service: TimerRaceService;
  let sessions: TimerSessionServiceMock;
  let clock: TimerClockServiceMock;
  let haptics: HapticsServiceMock;
  let wakeLock: WakeLockServiceMock;
  let roster: TimerRosterServiceMock;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(RACE_START_EPOCH_MS);
    sessions = timerSessionServiceMock();
    clock = timerClockServiceMock();
    haptics = hapticsServiceMock();
    wakeLock = wakeLockServiceMock();
    roster = timerRosterServiceMock();
    roster.expectedLapMs.set(RACE_EXPECTED_LAP_MS);
    TestBed.configureTestingModule({
      providers: [
        { provide: TimerSessionService, useValue: sessions },
        { provide: TimerRosterService, useValue: roster },
        { provide: TimerClockService, useValue: clock },
        { provide: HapticsService, useValue: haptics },
        { provide: WakeLockService, useValue: wakeLock },
      ],
    });
    // Injecting the service is what arms its effect — nothing else in the timer subscribes to the
    // measurement, so a spec that never asks for the service watches a race nobody is following.
    service = TestBed.inject(TimerRaceService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts the race from the key, wakes the digits, and refuses a race nobody is running', () => {
    expect(service.canStart(), 'nothing is open, so there is no roster to start').toBe(false);

    sessions.active.set(TIMER_SESSION_IDLE);

    expect(service.canStart(), 'a roster is standing there').toBe(true);

    service.start(TIMER_SESSION_IDLE);

    expect(haptics.play, 'the long «пуск» is felt at the mass start').toHaveBeenCalledExactlyOnceWith(TimerFeedback.start);
    expect(sessions.updateActive.mock.calls[0][0](TIMER_SESSION_IDLE), 'the tile order is written down in the same breath').toEqual({
      ...TIMER_SESSION_IDLE,
      status: TimerStatus.running,
      startedAtEpochMs: RACE_START_EPOCH_MS,
      tileOrder: RACE_FROZEN_TILE_ORDER,
    });
    expect(clock.start).toHaveBeenCalledWith({ ...TIMER_SESSION_IDLE, startedAtEpochMs: RACE_START_EPOCH_MS });
    expect(wakeLock.request, 'the screen is held from the mass start, not from the page opening').toHaveBeenCalledOnce();
    expect(service.woke()).toBe(true);

    clock.start.mockClear();
    sessions.active.set(RACE_EMPTY_SESSION);
    service.start(RACE_EMPTY_SESSION);

    expect(service.canStart(), 'an empty roster has nothing to time').toBe(false);
    expect(clock.start, 'and the code behind the key refuses it too').not.toHaveBeenCalled();
  });

  it('picks a restored race up, stops it on the key, and owes a reopened measurement its own time', async () => {
    clock.elapsedMs.set(RACE_ELAPSED_MS);
    await settle();

    expect(clock.stop, 'nothing is open, so there is nothing to stop either').not.toHaveBeenCalled();

    sessions.active.set(TIMER_SESSION);
    await settle();
    sessions.active.set(RACE_RUNNING_AGAIN);
    await settle();

    expect(clock.start, 'a race restored from localStorage is already running, and only started once').toHaveBeenCalledExactlyOnceWith(
      TIMER_SESSION,
    );
    expect(wakeLock.request, 'a race picked up mid-flight keeps the screen lit too').toHaveBeenCalledOnce();

    sessions.active.set(TIMER_SESSION_IDLE);
    await settle();

    expect(clock.stop, 'a race put back to idle gives the tick up').toHaveBeenCalledOnce();
    expect(clock.freeze, 'and one that never started stands at zero').toHaveBeenLastCalledWith(TIMER_CLOCK_IDLE_MS);

    clock.stop.mockClear();
    wakeLock.release.mockClear();
    sessions.active.set(TIMER_SESSION);
    await settle();

    service.stop(TIMER_SESSION);

    expect(clock.stop).toHaveBeenCalledOnce();
    expect(wakeLock.release, 'a stopped clock gives the screen back to the phone').toHaveBeenCalledOnce();
    expect(haptics.play).toHaveBeenLastCalledWith(TimerFeedback.finish);
    expect(sessions.updateActive.mock.calls[0][0](TIMER_SESSION)).toEqual({
      ...TIMER_SESSION,
      status: TimerStatus.finished,
      stoppedAtMs: RACE_ELAPSED_MS,
    });

    clock.freeze.mockClear();
    sessions.active.set(RACE_FINISHED_SESSION);
    await settle();

    expect(clock.freeze, 'a measurement opened again tomorrow says how long the race took').toHaveBeenCalledExactlyOnceWith(
      RACE_ELAPSED_MS,
    );
  });

  it('stops itself when the last runner is home and lets the screen go, both with the cockpit closed', async () => {
    clock.elapsedMs.set(RACE_ELAPSED_MS);
    sessions.active.set(TIMER_SESSION);
    await settle();
    sessions.active.set(COMPLETE_SESSION);
    await settle();

    expect(sessions.updateActive.mock.calls[0][0](COMPLETE_SESSION), 'the stop is the same one the key does').toEqual({
      ...COMPLETE_SESSION,
      status: TimerStatus.finished,
      stoppedAtMs: RACE_ELAPSED_MS,
    });
    expect(clock.stop, 'the digits stop with the race, not when somebody remembers the key').toHaveBeenCalledOnce();
    expect(wakeLock.release, 'and the screen goes back to the phone').toHaveBeenCalledOnce();

    clock.stop.mockClear();
    wakeLock.release.mockClear();
    sessions.active.set(TIMER_SESSION);
    await settle();

    // «←» on a running race: `closeActive()` empties the store and the cockpit is torn down with it.
    // This is the pass the old view-effect never survived — it died before it could run with `null`.
    sessions.active.set(null);
    await settle();

    expect(clock.stop, 'the 30 ms interval must not tick on behind a closed cockpit').toHaveBeenCalledOnce();
    expect(wakeLock.release, 'and the phone gets its auto-lock back the moment the race is left').toHaveBeenCalledOnce();
    expect(clock.freeze, 'nothing is open, so the digits are back at nought').toHaveBeenLastCalledWith(TIMER_CLOCK_IDLE_MS);
  });
});

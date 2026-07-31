import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { COMPLETE_SESSION } from '../core/timer/session-splits.mock';
import { TimerStatus } from '../core/timer/timer-session.enum';
import { TIMER_SESSION, TIMER_SESSION_IDLE } from '../core/timer/timer-session.mock';
import { TimerFeedback } from './haptics.enum';
import { HapticsService } from './haptics.service';
import { HapticsServiceMock, hapticsServiceMock } from './haptics.service.mock';
import { TimerClockService } from './timer-clock.service';
import { TimerClockServiceMock, timerClockServiceMock } from './timer-clock.service.mock';
import { RACE_ELAPSED_MS, RACE_EMPTY_SESSION, RACE_START_EPOCH_MS } from './timer-race.service.mock';
import { TimerRaceService } from './timer-race.service';
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

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(RACE_START_EPOCH_MS);
    sessions = timerSessionServiceMock();
    clock = timerClockServiceMock();
    haptics = hapticsServiceMock();
    wakeLock = wakeLockServiceMock();
    TestBed.configureTestingModule({
      providers: [
        { provide: TimerSessionService, useValue: sessions },
        { provide: TimerClockService, useValue: clock },
        { provide: HapticsService, useValue: haptics },
        { provide: WakeLockService, useValue: wakeLock },
      ],
    });
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
    expect(sessions.updateActive.mock.calls[0][0](TIMER_SESSION_IDLE)).toEqual({
      ...TIMER_SESSION_IDLE,
      status: TimerStatus.running,
      startedAtEpochMs: RACE_START_EPOCH_MS,
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

  it('picks a restored race up, stops it on the key, and stops itself when the last runner is home', () => {
    clock.elapsedMs.set(RACE_ELAPSED_MS);
    service.sync(null);

    expect(clock.stop, 'nothing is open, so there is nothing to stop either').not.toHaveBeenCalled();

    service.sync(TIMER_SESSION);
    service.sync(TIMER_SESSION);

    expect(clock.start, 'a race restored from localStorage is already running, and only started once').toHaveBeenCalledExactlyOnceWith(
      TIMER_SESSION,
    );
    expect(wakeLock.request, 'a race picked up mid-flight keeps the screen lit too').toHaveBeenCalledOnce();

    service.sync(TIMER_SESSION_IDLE);

    expect(clock.stop, 'a race put back to idle gives the tick up').toHaveBeenCalledOnce();

    clock.stop.mockClear();
    wakeLock.release.mockClear();
    service.sync(TIMER_SESSION);

    service.stop(TIMER_SESSION);

    expect(clock.stop).toHaveBeenCalledOnce();
    expect(wakeLock.release, 'a stopped clock gives the screen back to the phone').toHaveBeenCalledOnce();
    expect(haptics.play).toHaveBeenLastCalledWith(TimerFeedback.finish);
    expect(sessions.updateActive.mock.calls[0][0](TIMER_SESSION)).toEqual({
      ...TIMER_SESSION,
      status: TimerStatus.finished,
      stoppedAtMs: RACE_ELAPSED_MS,
    });

    sessions.updateActive.mockClear();
    clock.stop.mockClear();
    wakeLock.release.mockClear();
    service.sync(TIMER_SESSION);
    service.sync(COMPLETE_SESSION);

    expect(sessions.updateActive.mock.calls[0][0](COMPLETE_SESSION), 'the stop is the same one the key does').toEqual({
      ...COMPLETE_SESSION,
      status: TimerStatus.finished,
      stoppedAtMs: RACE_ELAPSED_MS,
    });
    expect(clock.stop, 'the digits stop with the race, not when somebody remembers the key').toHaveBeenCalledOnce();
    expect(wakeLock.release, 'and the screen goes back to the phone').toHaveBeenCalledOnce();
  });
});

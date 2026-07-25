import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { TIMER_SESSION, TIMER_SESSION_IDLE, TIMER_SESSION_STARTED_AT_EPOCH_MS } from '../core/timer/timer-session.mock';
import { TIMER_CLOCK_IDLE_MS, TIMER_TICK_INTERVAL_MS } from './timer-clock.constant';
import { TimerClockService } from './timer-clock.service';
import {
  CLOCK_MOCK_NOW_MS,
  MONOTONIC_STEP_MS,
  RESTORED_ELAPSED_MS,
  ROUNDED_STEP_MS,
  SKEWED_EPOCH_STEP_MS,
  timerClockServiceMock,
} from './timer-clock.service.mock';
import { SSR_DOCUMENT_MOCK, TimerViewMock, VIEW_INTERVAL_ID, VIEW_MONOTONIC_MS, timerViewMock } from './timer-view.mock';

describe('TimerClockService', () => {
  let view: TimerViewMock;

  beforeEach(() => {
    view = timerViewMock();
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: { defaultView: view } }] });
  });

  it('shows nothing until it is started, then ticks off the monotonic clock at 10 Hz', () => {
    const service = TestBed.inject(TimerClockService);

    expect(service.elapsedMs()).toBe(TIMER_CLOCK_IDLE_MS);
    expect(service.nowMs(), 'a tap before the mass start has no time to record').toBe(TIMER_CLOCK_IDLE_MS);

    service.start(TIMER_SESSION_IDLE);

    expect(service.elapsedMs()).toBe(TIMER_CLOCK_IDLE_MS);
    expect(view.setInterval).toHaveBeenCalledWith(expect.any(Function), TIMER_TICK_INTERVAL_MS);

    view.performance.now.mockReturnValue(VIEW_MONOTONIC_MS + MONOTONIC_STEP_MS);
    view.setInterval.mock.calls[0][0]();

    expect(service.elapsedMs(), 'the digits are whole milliseconds').toBe(ROUNDED_STEP_MS);
    expect(service.nowMs()).toBe(ROUNDED_STEP_MS);

    service.stop();

    expect(view.clearInterval).toHaveBeenCalledWith(VIEW_INTERVAL_ID);
    expect(service.elapsedMs(), 'the stopped clock keeps the time the race ended on').toBe(ROUNDED_STEP_MS);
    expect(service.nowMs(), 'and a split tapped right after the stop still lands right').toBe(ROUNDED_STEP_MS);

    service.stop();

    expect(view.clearInterval, 'stopping twice clears one timer').toHaveBeenCalledOnce();
  });

  it('resumes a race restored from localStorage where the dropped tab left it', () => {
    const service = TestBed.inject(TimerClockService);

    view.Date.now.mockReturnValue(TIMER_SESSION_STARTED_AT_EPOCH_MS + RESTORED_ELAPSED_MS);
    service.start(TIMER_SESSION);

    expect(service.elapsedMs(), 'the base is rebuilt from the session own start stamp').toBe(RESTORED_ELAPSED_MS);

    view.Date.now.mockReturnValue(TIMER_SESSION_STARTED_AT_EPOCH_MS + SKEWED_EPOCH_STEP_MS);
    service.start(TIMER_SESSION);

    expect(service.elapsedMs(), 'a system clock that jumped backwards cannot make a split negative').toBe(TIMER_CLOCK_IDLE_MS);
    expect(view.clearInterval, 'restarting stops the previous tick').toHaveBeenCalledOnce();
  });

  it('stops ticking when the injector goes down', () => {
    const service = TestBed.inject(TimerClockService);

    service.start(TIMER_SESSION_IDLE);
    service.ngOnDestroy();

    expect(view.clearInterval).toHaveBeenCalledWith(VIEW_INTERVAL_ID);
  });

  it('exposes a stand-in of the same surface for the components that will consume it', () => {
    const mock = timerClockServiceMock();

    expect(mock.elapsedMs()).toBe(TIMER_CLOCK_IDLE_MS);
    expect(mock.nowMs()).toBe(CLOCK_MOCK_NOW_MS);

    mock.start(TIMER_SESSION);
    mock.stop();

    expect(mock.start).toHaveBeenCalledWith(TIMER_SESSION);
    expect(mock.stop).toHaveBeenCalledOnce();
  });
});

describe('TimerClockService without a window', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: SSR_DOCUMENT_MOCK }] });
  });

  it('starts and stops without a clock to read during prerender', () => {
    const service = TestBed.inject(TimerClockService);

    service.start(TIMER_SESSION);
    service.stop();

    expect(service.elapsedMs()).toBe(TIMER_CLOCK_IDLE_MS);
    expect(service.nowMs()).toBe(TIMER_CLOCK_IDLE_MS);
  });
});

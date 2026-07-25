import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Mock, vi } from 'vitest';

import { TIMER_COUNTDOWN_FROM, TIMER_COUNTDOWN_STEP_MS } from './session-clock.constant';
import { TimerCountdownService } from './timer-countdown.service';
import {
  COUNTDOWN_INTERVAL_ID,
  COUNTDOWN_LAST_STEP,
  COUNTDOWN_SECOND_STEP,
  COUNTDOWN_SSR_DOCUMENT,
  CountdownViewMock,
  REDUCED_MOTION_MATCH,
  countdownViewMock,
} from './timer-countdown.service.mock';

describe('TimerCountdownService', () => {
  let view: CountdownViewMock;
  let launch: Mock;

  beforeEach(() => {
    view = countdownViewMock();
    launch = vi.fn();
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: { defaultView: view } }] });
  });

  it('counts three, two, one and then launches, clearing its own timer', () => {
    const service = TestBed.inject(TimerCountdownService);

    expect(service.value(), 'nothing is on screen before the key is pressed').toBeNull();

    service.run(launch);

    expect(service.value()).toBe(TIMER_COUNTDOWN_FROM);
    expect(view.setInterval).toHaveBeenCalledWith(expect.any(Function), TIMER_COUNTDOWN_STEP_MS);

    const step = view.setInterval.mock.calls[0][0];

    step();

    expect(service.value()).toBe(COUNTDOWN_SECOND_STEP);

    step();

    expect(service.value()).toBe(COUNTDOWN_LAST_STEP);
    expect(launch, 'the race does not start on «1»').not.toHaveBeenCalled();

    step();

    expect(service.value(), 'the veil comes down with the launch').toBeNull();
    expect(launch).toHaveBeenCalledOnce();
    expect(view.clearInterval).toHaveBeenCalledWith(COUNTDOWN_INTERVAL_ID);
  });

  it('skips the whole ceremony for somebody who asked for less motion', () => {
    view.matchMedia.mockReturnValue(REDUCED_MOTION_MATCH);

    const service = TestBed.inject(TimerCountdownService);

    service.run(launch);

    expect(launch).toHaveBeenCalledOnce();
    expect(service.value()).toBeNull();
    expect(view.setInterval).not.toHaveBeenCalled();
  });

  it('drops the ceremony when the screen goes away', () => {
    const service = TestBed.inject(TimerCountdownService);

    service.run(launch);
    service.ngOnDestroy();

    expect(view.clearInterval).toHaveBeenCalledWith(COUNTDOWN_INTERVAL_ID);
    expect(service.value()).toBeNull();
    expect(launch).not.toHaveBeenCalled();
  });
});

describe('TimerCountdownService without a window', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: COUNTDOWN_SSR_DOCUMENT }] });
  });

  it('launches straight away during a prerender', () => {
    const service = TestBed.inject(TimerCountdownService);
    const launch = vi.fn();

    service.run(launch);

    expect(launch).toHaveBeenCalledOnce();
    expect(service.value()).toBeNull();
  });
});

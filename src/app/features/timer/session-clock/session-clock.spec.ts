import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { COMPLETE_SESSION } from '../../../core/timer/session-splits.mock';
import { TimerStatus } from '../../../core/timer/timer-session.enum';
import {
  TIMER_SESSION,
  TIMER_SESSION_FINISHED,
  TIMER_SESSION_IDLE,
  TIMER_SESSION_WITHOUT_SPLITS,
} from '../../../core/timer/timer-session.mock';
import { TimerFeedback } from '../../../state/haptics.enum';
import { HapticsService } from '../../../state/haptics.service';
import { HapticsServiceMock, hapticsServiceMock } from '../../../state/haptics.service.mock';
import { TimerClockService } from '../../../state/timer-clock.service';
import { TimerClockServiceMock, timerClockServiceMock } from '../../../state/timer-clock.service.mock';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerSessionServiceMock, timerSessionServiceMock } from '../../../state/timer-session.service.mock';
import { WakeLockService } from '../../../state/wake-lock.service';
import { WakeLockServiceMock, wakeLockServiceMock } from '../../../state/wake-lock.service.mock';
import { TimerFarewellService } from '../timer-farewell.service';
import { TimerFarewellServiceMock, timerFarewellServiceMock } from '../timer-farewell.service.mock';
import { TimerClock } from './session-clock';
import {
  CLOCK_ELAPSED_MS,
  CLOCK_EMPTY_SESSION,
  CLOCK_EMPTY_COUNT_TEXT,
  CLOCK_EMPTY_PROGRESS,
  CLOCK_FINISH_COUNT,
  CLOCK_FRACTION_TEXT,
  CLOCK_LAP_COUNT,
  CLOCK_READOUT_TEXT,
  CLOCK_START_EPOCH_MS,
  CLOCK_SUMMARY_BEST_TEXT,
  CLOCK_TOTAL_COUNT,
} from './session-clock.mock';

describe('TimerClock', () => {
  let fixture: ComponentFixture<TimerClock>;
  let sessions: TimerSessionServiceMock;
  let clock: TimerClockServiceMock;
  let haptics: HapticsServiceMock;
  let wakeLock: WakeLockServiceMock;
  let farewell: TimerFarewellServiceMock;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(CLOCK_START_EPOCH_MS);
    sessions = timerSessionServiceMock();
    clock = timerClockServiceMock();
    haptics = hapticsServiceMock();
    wakeLock = wakeLockServiceMock();
    farewell = timerFarewellServiceMock();
    TestBed.configureTestingModule({
      providers: [
        { provide: TimerSessionService, useValue: sessions },
        { provide: TimerClockService, useValue: clock },
        { provide: HapticsService, useValue: haptics },
        { provide: WakeLockService, useValue: wakeLock },
        { provide: TimerFarewellService, useValue: farewell },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
  });

  it('picks a restored race up where it was, shows the counters and stops on «Стоп»', async () => {
    sessions.active.set(TIMER_SESSION);
    clock.elapsedMs.set(CLOCK_ELAPSED_MS);
    fixture = TestBed.createComponent(TimerClock);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const values = [...element.querySelectorAll('.timer-clock__counter-value')];

    expect(clock.start, 'a race restored from localStorage is already running').toHaveBeenCalledWith(TIMER_SESSION);
    expect(element.querySelector('.timer-clock__figure')?.textContent?.trim()).toBe(CLOCK_READOUT_TEXT);
    expect(element.querySelector('.timer-clock__fraction')?.textContent?.trim(), 'the hundredths are their own span').toBe(
      CLOCK_FRACTION_TEXT,
    );
    expect(values.map((value) => value.textContent?.trim())).toEqual([
      String(CLOCK_LAP_COUNT),
      String(CLOCK_TOTAL_COUNT),
      String(CLOCK_FINISH_COUNT),
    ]);

    const fill: HTMLElement | null = element.querySelector('.timer-clock__progress-fill');

    expect(fill?.style.getPropertyValue('--timer-progress')).toBe(String(CLOCK_FINISH_COUNT / CLOCK_TOTAL_COUNT));

    const control: HTMLElement | null = element.querySelector('.timer-clock__control_stop');

    control?.click();

    expect(clock.stop).toHaveBeenCalledOnce();
    expect(wakeLock.request, 'a race picked up mid-flight keeps the screen lit too').toHaveBeenCalledOnce();
    expect(wakeLock.release, 'a stopped clock gives the screen back to the phone').toHaveBeenCalledOnce();
    expect(haptics.play).toHaveBeenLastCalledWith(TimerFeedback.finish);
    expect(sessions.updateActive.mock.calls[0][0](TIMER_SESSION)).toEqual({
      ...TIMER_SESSION,
      status: TimerStatus.finished,
      stoppedAtMs: CLOCK_ELAPSED_MS,
    });
  });

  it('turns the counters into the result of the race, and asks for a longer auto-lock where it must', async () => {
    sessions.active.set(TIMER_SESSION);
    fixture = TestBed.createComponent(TimerClock);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.timer-clock__summary'), 'the counters stay while anybody is still out').toBeNull();

    sessions.active.set(TIMER_SESSION_WITHOUT_SPLITS);
    farewell.settled.set(true);
    await fixture.whenStable();

    expect(element.querySelector('.timer-clock__summary'), 'a race where nobody finished has no line to show').toBeNull();

    sessions.active.set(COMPLETE_SESSION);
    await fixture.whenStable();

    expect(element.querySelector('.timer-clock__summary')?.textContent).toContain(CLOCK_SUMMARY_BEST_TEXT);
    expect(element.querySelector('.timer-clock__counters'), 'and «круг: 15 из 15» has nothing left to say').toBeNull();
    expect(element.querySelector('.timer-clock__control_stop'), 'the clock still has to be stoppable').not.toBeNull();
    expect(element.querySelector('.timer-clock__wake')).toBeNull();

    wakeLock.unsupported.set(true);
    await fixture.whenStable();

    expect(element.querySelector('.timer-clock__wake')?.textContent?.trim()).not.toBe('');
  });

  it('starts the race from the tap, and refuses to start a race nobody is running', async () => {
    sessions.active.set(TIMER_SESSION_IDLE);
    fixture = TestBed.createComponent(TimerClock);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.timer-clock__roster-call'), 'a roster is standing there, so nothing has to be asked for').toBeNull();
    expect(clock.start, 'nothing ticks before the key is pressed').not.toHaveBeenCalled();

    element.querySelector<HTMLElement>('.timer-clock__control')?.click();
    await fixture.whenStable();

    expect(haptics.play, 'the long «пуск» is felt at the mass start').toHaveBeenCalledExactlyOnceWith(TimerFeedback.start);
    expect(sessions.updateActive.mock.calls[0][0](TIMER_SESSION_IDLE)).toEqual({
      ...TIMER_SESSION_IDLE,
      status: TimerStatus.running,
      startedAtEpochMs: CLOCK_START_EPOCH_MS,
    });
    expect(clock.start).toHaveBeenCalledWith({ ...TIMER_SESSION_IDLE, startedAtEpochMs: CLOCK_START_EPOCH_MS });
    expect(wakeLock.request, 'the screen is held from the mass start, not from the page opening').toHaveBeenCalledOnce();
    expect(element.querySelector('.timer-clock__figure_wake'), 'the digits wake up once').not.toBeNull();

    const asked = vi.fn();

    fixture.componentInstance.roster.subscribe(asked);
    clock.start.mockClear();
    sessions.active.set(CLOCK_EMPTY_SESSION);
    await fixture.whenStable();

    const control: HTMLButtonElement | null = element.querySelector('.timer-clock__control');

    expect(control?.disabled, 'an empty roster has nothing to time').toBe(true);

    control?.click();
    fixture.componentInstance.onStart(CLOCK_EMPTY_SESSION);

    expect(clock.start, 'and neither the key nor the code behind it starts the clock').not.toHaveBeenCalled();

    element.querySelector<HTMLElement>('.timer-clock__roster-call')?.click();

    expect(asked, 'the reason is also the way to fix it').toHaveBeenCalledOnce();
  });

  it('stands at zero with nothing open, and offers no key once there is nothing left to do', async () => {
    fixture = TestBed.createComponent(TimerClock);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const values = [...element.querySelectorAll('.timer-clock__counter-value')];
    const fill: HTMLElement | null = element.querySelector('.timer-clock__progress-fill');

    expect(values.map((value) => value.textContent?.trim())).toEqual([
      CLOCK_EMPTY_COUNT_TEXT,
      CLOCK_EMPTY_COUNT_TEXT,
      CLOCK_EMPTY_COUNT_TEXT,
    ]);
    expect(fill?.style.getPropertyValue('--timer-progress')).toBe(CLOCK_EMPTY_PROGRESS);
    expect(element.querySelector('.timer-clock__control'), 'no session, no key to press').toBeNull();
    expect(clock.start).not.toHaveBeenCalled();

    sessions.active.set(TIMER_SESSION_FINISHED);
    await fixture.whenStable();

    expect(element.querySelector('.timer-clock__control'), 'a finished race has no key either').toBeNull();
  });
});

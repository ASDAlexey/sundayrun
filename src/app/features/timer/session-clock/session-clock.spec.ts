import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { COMPLETE_SESSION } from '../../../core/timer/session-splits.mock';
import { TIMER_SESSION, TIMER_SESSION_IDLE, TIMER_SESSION_WITHOUT_SPLITS } from '../../../core/timer/timer-session.mock';
import { TimerClockService } from '../../../state/timer-clock.service';
import { TimerClockServiceMock, timerClockServiceMock } from '../../../state/timer-clock.service.mock';
import { TimerRaceService } from '../../../state/timer-race.service';
import { TimerRaceServiceMock, timerRaceServiceMock } from '../../../state/timer-race.service.mock';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerSessionServiceMock, timerSessionServiceMock } from '../../../state/timer-session.service.mock';
import { WakeLockService } from '../../../state/wake-lock.service';
import { WakeLockServiceMock, wakeLockServiceMock } from '../../../state/wake-lock.service.mock';
import { TimerFarewellService } from '../timer-farewell.service';
import { TimerFarewellServiceMock, timerFarewellServiceMock } from '../timer-farewell.service.mock';
import { TimerClock } from './session-clock';
import {
  CLOCK_ELAPSED_MS,
  CLOCK_EMPTY_COUNT_TEXT,
  CLOCK_EMPTY_PROGRESS,
  CLOCK_EMPTY_SESSION,
  CLOCK_FINISH_COUNT,
  CLOCK_FRACTION_TEXT,
  CLOCK_LAP_COUNT,
  CLOCK_READOUT_TEXT,
  CLOCK_SUMMARY_BEST_TEXT,
  CLOCK_TOTAL_COUNT,
} from './session-clock.mock';

describe('TimerClock', () => {
  let fixture: ComponentFixture<TimerClock>;
  let sessions: TimerSessionServiceMock;
  let clock: TimerClockServiceMock;
  let race: TimerRaceServiceMock;
  let wakeLock: WakeLockServiceMock;
  let farewell: TimerFarewellServiceMock;

  beforeEach(() => {
    sessions = timerSessionServiceMock();
    clock = timerClockServiceMock();
    race = timerRaceServiceMock();
    wakeLock = wakeLockServiceMock();
    farewell = timerFarewellServiceMock();
    TestBed.configureTestingModule({
      providers: [
        { provide: TimerSessionService, useValue: sessions },
        { provide: TimerClockService, useValue: clock },
        { provide: TimerRaceService, useValue: race },
        { provide: WakeLockService, useValue: wakeLock },
        { provide: TimerFarewellService, useValue: farewell },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('spells the running figure, the counters and the bar, and wakes the digits on the mass start', async () => {
    sessions.active.set(TIMER_SESSION);
    clock.elapsedMs.set(CLOCK_ELAPSED_MS);
    fixture = TestBed.createComponent(TimerClock);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const values = [...element.querySelectorAll('.timer-clock__counter-value')];

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

    race.woke.set(true);
    await fixture.whenStable();

    expect(element.querySelector('.timer-clock__figure_wake'), 'the digits wake up on the mass start').not.toBeNull();
  });

  it('turns the counters into the result, asks for a longer auto-lock, and stands at zero when empty', async () => {
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
    expect(element.querySelector('.timer-clock__wake')).toBeNull();

    wakeLock.unsupported.set(true);
    await fixture.whenStable();

    expect(element.querySelector('.timer-clock__wake')?.textContent?.trim()).not.toBe('');

    const asked = vi.fn();

    fixture.componentInstance.roster.subscribe(asked);
    sessions.active.set(TIMER_SESSION_IDLE);
    await fixture.whenStable();

    expect(element.querySelector('.timer-clock__roster-call'), 'a roster is standing there, so nothing has to be asked for').toBeNull();

    sessions.active.set(null);
    await fixture.whenStable();

    expect(
      [...element.querySelectorAll('.timer-clock__counter-value')].map((value) => value.textContent?.trim()),
      'nothing is open, so every counter reads nought',
    ).toEqual([CLOCK_EMPTY_COUNT_TEXT, CLOCK_EMPTY_COUNT_TEXT, CLOCK_EMPTY_COUNT_TEXT]);

    race.canStart.set(false);
    sessions.active.set(CLOCK_EMPTY_SESSION);
    await fixture.whenStable();

    const values = [...element.querySelectorAll('.timer-clock__counter-value')];
    const fill: HTMLElement | null = element.querySelector('.timer-clock__progress-fill');

    expect(values.map((value) => value.textContent?.trim())).toEqual([
      CLOCK_EMPTY_COUNT_TEXT,
      CLOCK_EMPTY_COUNT_TEXT,
      CLOCK_EMPTY_COUNT_TEXT,
    ]);
    expect(fill?.style.getPropertyValue('--timer-progress')).toBe(CLOCK_EMPTY_PROGRESS);

    element.querySelector<HTMLElement>('.timer-clock__roster-call')?.click();

    expect(asked, 'the reason «Старт» is dead is also the way to fix it').toHaveBeenCalledOnce();
  });
});

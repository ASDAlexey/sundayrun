import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TIMER_SESSION, TIMER_SESSION_FINISHED, TIMER_SESSION_IDLE } from '../../../core/timer/timer-session.mock';
import { TimerRaceService } from '../../../state/timer-race.service';
import { TimerRaceServiceMock, timerRaceServiceMock } from '../../../state/timer-race.service.mock';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerSessionServiceMock, timerSessionServiceMock } from '../../../state/timer-session.service.mock';
import { TimerRaceKey } from './race-key';
import { RACE_KEY_START_TEXT, RACE_KEY_STOP_TEXT } from './race-key.mock';

describe('TimerRaceKey', () => {
  let fixture: ComponentFixture<TimerRaceKey>;
  let sessions: TimerSessionServiceMock;
  let race: TimerRaceServiceMock;

  beforeEach(() => {
    sessions = timerSessionServiceMock();
    race = timerRaceServiceMock();
    TestBed.configureTestingModule({
      providers: [
        { provide: TimerSessionService, useValue: sessions },
        { provide: TimerRaceService, useValue: race },
      ],
    });
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('starts on the first press, stops on the next, and goes dead over an empty roster', async () => {
    sessions.active.set(TIMER_SESSION_IDLE);
    fixture = TestBed.createComponent(TimerRaceKey);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;
    const key = (): HTMLButtonElement | null => element.querySelector('.timer-key');

    expect(key()?.textContent?.trim()).toBe(RACE_KEY_START_TEXT);

    key()?.click();

    expect(race.start).toHaveBeenCalledExactlyOnceWith(TIMER_SESSION_IDLE);

    sessions.active.set(TIMER_SESSION);
    await fixture.whenStable();

    expect(key()?.textContent?.trim(), 'one key and one place to look, not two').toBe(RACE_KEY_STOP_TEXT);
    expect(key()?.classList.contains('timer-key_stop')).toBe(true);

    key()?.click();

    expect(race.stop).toHaveBeenCalledExactlyOnceWith(TIMER_SESSION);

    race.canStart.set(false);
    sessions.active.set(TIMER_SESSION_IDLE);
    await fixture.whenStable();

    expect(key()?.disabled, 'a race nobody is running cannot be started').toBe(true);
  });

  it('offers nothing to press once the race is over or nothing is open', async () => {
    sessions.active.set(TIMER_SESSION_FINISHED);
    fixture = TestBed.createComponent(TimerRaceKey);
    await fixture.whenStable();

    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector('.timer-key'), 'a finished race steps aside for «Сохранить»').toBeNull();

    sessions.active.set(null);
    await fixture.whenStable();

    expect(element.querySelector('.timer-key'), 'no session, no key to press').toBeNull();
  });
});

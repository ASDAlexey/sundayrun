import { TimerStatus } from './timer-session.enum';
import { clearRoster, resetSession } from './session-reset';
import { TIMER_SESSION, TIMER_SESSION_IDLE, TIMER_SESSION_RUNNERS } from './timer-session.mock';

describe('resetSession', () => {
  it('wipes the clock and the journal, keeps the roster, and refuses an untouched session', () => {
    const reset = resetSession(TIMER_SESSION);

    expect(reset.status).toBe(TimerStatus.idle);
    expect(reset.startedAtEpochMs).toBeNull();
    expect(reset.stoppedAtMs).toBeNull();
    expect(reset.splits).toEqual([]);
    expect(reset.runners, 'the people who came are still here').toBe(TIMER_SESSION_RUNNERS);

    expect(resetSession(TIMER_SESSION_IDLE), 'nothing to forget costs no storage write').toBe(TIMER_SESSION_IDLE);
  });
});

describe('clearRoster', () => {
  it('empties a line-up assembled before the mass start and keeps the measurement itself', () => {
    const cleared = clearRoster(TIMER_SESSION_IDLE);

    expect(cleared.runners).toEqual([]);
    expect(cleared.splits).toEqual([]);
    expect(cleared.id, 'the measurement keeps its place in «Мои замеры»').toBe(TIMER_SESSION_IDLE.id);
    expect(cleared.dateIso).toBe(TIMER_SESSION_IDLE.dateIso);
  });

  it('refuses a race in hand and an empty roster alike', () => {
    expect(clearRoster(TIMER_SESSION), 'mid-race this would be the whole protocol').toBe(TIMER_SESSION);

    const empty = clearRoster(TIMER_SESSION_IDLE);

    expect(clearRoster(empty), 'nobody to remove costs no storage write').toBe(empty);
  });
});

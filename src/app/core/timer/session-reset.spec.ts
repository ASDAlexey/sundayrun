import { TimerStatus } from './timer-session.enum';
import { resetSession } from './session-reset';
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

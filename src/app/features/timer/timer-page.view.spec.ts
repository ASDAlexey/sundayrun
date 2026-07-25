import { TIMER_SESSION } from '../../core/timer/timer-session.mock';
import { TIMER_HEADER_EMPTY } from './timer-page.constant';
import { TIMER_HEADER_RUNNING } from './timer-page.mock';
import { buildTimerHeader } from './timer-page.view';

describe('buildTimerHeader', () => {
  it('marks the race with its date and counts the lap, the finish and the roster', () => {
    expect(buildTimerHeader(TIMER_SESSION)).toEqual(TIMER_HEADER_RUNNING);
    expect(buildTimerHeader(null), 'nothing open means nothing to count or undo').toBe(TIMER_HEADER_EMPTY);
  });
});

import { TIMER_SESSION, TIMER_SESSION_ID } from '../core/timer/timer-session.mock';
import { EMPTY_TIMER_SESSION_STATE } from './timer-session.constant';
import { readTimerSessionState, serializeTimerSessionState } from './timer-session.storage';
import {
  ALL_BROKEN_TIMER_SESSIONS_JSON,
  DANGLING_ACTIVE_ID_JSON,
  FOREIGN_SCHEMA_TIMER_SESSIONS_JSON,
  MALFORMED_TIMER_SESSIONS_JSON,
  NON_ARRAY_TIMER_SESSIONS_JSON,
  NON_OBJECT_TIMER_SESSIONS_JSON,
  NON_STRING_ACTIVE_ID_JSON,
  PARTLY_BROKEN_TIMER_SESSIONS_JSON,
  STORED_TIMER_SESSIONS_JSON,
  STORED_TIMER_SESSION_STATE,
} from './timer-session.storage.mock';

describe('readTimerSessionState', () => {
  it('decodes the stored measurements newest first and keeps the pointer to the open one', () => {
    expect(readTimerSessionState(STORED_TIMER_SESSIONS_JSON)).toEqual(STORED_TIMER_SESSION_STATE);
    expect(readTimerSessionState(null), 'a device that never recorded anything starts empty').toEqual(EMPTY_TIMER_SESSION_STATE);
  });

  it('degrades every unusable payload to an empty list instead of throwing mid-race', () => {
    expect(readTimerSessionState(MALFORMED_TIMER_SESSIONS_JSON)).toEqual(EMPTY_TIMER_SESSION_STATE);
    expect(readTimerSessionState(NON_OBJECT_TIMER_SESSIONS_JSON)).toEqual(EMPTY_TIMER_SESSION_STATE);
    expect(readTimerSessionState(FOREIGN_SCHEMA_TIMER_SESSIONS_JSON), 'another release wrote it').toEqual(EMPTY_TIMER_SESSION_STATE);
    expect(readTimerSessionState(NON_ARRAY_TIMER_SESSIONS_JSON)).toEqual(EMPTY_TIMER_SESSION_STATE);
    expect(readTimerSessionState(ALL_BROKEN_TIMER_SESSIONS_JSON), 'a broken runner, split or publish status').toEqual(
      EMPTY_TIMER_SESSION_STATE,
    );
  });

  it('drops only the measurements that no longer match the model and forgets a pointer to nothing', () => {
    expect(readTimerSessionState(PARTLY_BROKEN_TIMER_SESSIONS_JSON)).toEqual({ sessions: [TIMER_SESSION], activeId: TIMER_SESSION_ID });
    expect(readTimerSessionState(DANGLING_ACTIVE_ID_JSON)).toEqual({ sessions: [TIMER_SESSION], activeId: null });
    expect(readTimerSessionState(NON_STRING_ACTIVE_ID_JSON)).toEqual({ sessions: [TIMER_SESSION], activeId: null });
  });
});

describe('serializeTimerSessionState', () => {
  it('writes a payload it can read back unchanged', () => {
    expect(readTimerSessionState(serializeTimerSessionState(STORED_TIMER_SESSION_STATE))).toEqual(STORED_TIMER_SESSION_STATE);
  });
});

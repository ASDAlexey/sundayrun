import { TimerStatus } from '../core/timer/timer-session.enum';
import { TimerSession } from '../core/timer/timer-session.interface';
import { TIMER_SESSION, TIMER_SESSION_CREATED_AT_MS, TIMER_SESSION_FINISHED, TIMER_SESSION_ID } from '../core/timer/timer-session.mock';
import { TIMER_SESSION_SCHEMA_VERSION } from './timer-session.constant';
import { TimerSessionState } from './timer-session.interface';

/** A week before the running one, and already published — the second row of «Мои замеры». */
export const OLDER_TIMER_SESSION_ID = 'session-2026-07-19';

export const OLDER_TIMER_SESSION: TimerSession = {
  ...TIMER_SESSION_FINISHED,
  id: OLDER_TIMER_SESSION_ID,
  dateIso: '2026-07-19',
  createdAtMs: TIMER_SESSION_CREATED_AT_MS - 604_800_000,
};

/** The state both stored fixtures below decode to: newest first, the running one open. */
export const STORED_TIMER_SESSION_STATE: TimerSessionState = {
  sessions: [TIMER_SESSION, OLDER_TIMER_SESSION],
  activeId: TIMER_SESSION_ID,
};

function payload(sessions: unknown, activeId: unknown, schemaVersion: number = TIMER_SESSION_SCHEMA_VERSION): string {
  return JSON.stringify({ schemaVersion, sessions, activeId });
}

/** Written oldest first on purpose: reading it back must reorder the list, newest measurement first. */
export const STORED_TIMER_SESSIONS_JSON = payload([OLDER_TIMER_SESSION, TIMER_SESSION], TIMER_SESSION_ID);

/** A hand-truncated write — the tab died mid-`setItem`. */
export const MALFORMED_TIMER_SESSIONS_JSON = '{"schemaVersion": 1, "sessions"';

/** Valid JSON that is not an object at all. */
export const NON_OBJECT_TIMER_SESSIONS_JSON = '42';

/** A payload of a future release: its sessions may mean something else entirely, so it is ignored. */
export const FOREIGN_SCHEMA_TIMER_SESSIONS_JSON = payload([TIMER_SESSION], TIMER_SESSION_ID, TIMER_SESSION_SCHEMA_VERSION + 1);

/** `sessions` hand-edited into something that is not a list. */
export const NON_ARRAY_TIMER_SESSIONS_JSON = payload('всё пропало', null);

/** The pointer survived a measurement that did not; it must not leave the page on a ghost session. */
export const DANGLING_ACTIVE_ID_JSON = payload([TIMER_SESSION], 'session-that-was-deleted');

/** A pointer of the wrong type degrades exactly like a dangling one. */
export const NON_STRING_ACTIVE_ID_JSON = payload([TIMER_SESSION], TIMER_SESSION_CREATED_AT_MS);

/** A session whose status is not one the release knows: the entry goes, the rest of the list stays. */
export const BROKEN_STATUS_SESSION = { ...TIMER_SESSION, id: 'session-broken', status: 'подсчитывается' };

export const PARTLY_BROKEN_TIMER_SESSIONS_JSON = payload([BROKEN_STATUS_SESSION, TIMER_SESSION], TIMER_SESSION_ID);

/** A runner hand-edited past the model — the session it belongs to is dropped whole. */
export const BROKEN_RUNNER_SESSION = {
  ...TIMER_SESSION,
  id: 'session-broken-runner',
  runners: [{ id: 'runner-x', fullName: 'Иванов Иван', athleteKey: null, gender: 'X', outcome: TimerStatus.idle }],
};

/** A split without a time, in a session that is otherwise perfect. */
export const BROKEN_SPLIT_SESSION = {
  ...TIMER_SESSION,
  id: 'session-broken-split',
  splits: [{ id: 'split-x', atMs: '17:00', runnerId: null }],
};

/** A publish status that lost its state. */
export const BROKEN_PUBLISH_SESSION = { ...TIMER_SESSION, id: 'session-broken-publish', publish: { error: null, sha: null } };

/** Three unusable measurements and nothing else: the device starts from an empty list. */
export const ALL_BROKEN_TIMER_SESSIONS_JSON = payload([BROKEN_RUNNER_SESSION, BROKEN_SPLIT_SESSION, BROKEN_PUBLISH_SESSION], null);

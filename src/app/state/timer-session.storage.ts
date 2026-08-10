import { TimerPublishStatus, TimerRunner, TimerSession, TimerSplit } from '../core/timer/timer-session.interface';
import { EMPTY_TIMER_SESSION_STATE, TIMER_SESSION_SCHEMA_VERSION } from './timer-session.constant';
import { TimerSessionState } from './timer-session.interface';
import { StoredTimerSession } from './timer-session.type';
import { isArrayOf, isNonEmptyString, isNullableGender, isNullableNumber, isNullableString, isOneOf, isRecord } from './timer-storage';
import { TIMER_PUBLISH_STATE_VALUES, TIMER_ROLE_VALUES, TIMER_RUNNER_OUTCOME_VALUES, TIMER_STATUS_VALUES } from './timer-storage.constant';

/**
 * Reads the measurements of the device back. The payload is a plain localStorage string a person can
 * edit, truncate or leave behind from an older release, so a session that no longer matches the model
 * is dropped rather than handed to the grid half-built; a whole payload that is broken or of a foreign
 * schema degrades to «no measurements». Nothing here throws — losing a race to an exception during the
 * race is the one failure the timer cannot afford.
 */
export function readTimerSessionState(raw: string | null): TimerSessionState {
  if (raw === null) {
    return EMPTY_TIMER_SESSION_STATE;
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (isRecord(parsed) && parsed['schemaVersion'] === TIMER_SESSION_SCHEMA_VERSION) {
      return toState(parsed['sessions'], parsed['activeId']);
    }
  } catch {
    // Broken JSON degrades exactly like a wrong shape: the device starts with an empty list.
  }

  return EMPTY_TIMER_SESSION_STATE;
}

export function serializeTimerSessionState(state: TimerSessionState): string {
  return JSON.stringify({ schemaVersion: TIMER_SESSION_SCHEMA_VERSION, sessions: state.sessions, activeId: state.activeId });
}

/** Newest measurement first — «Мои замеры» opens on what was just recorded. */
export function byNewestSession(left: TimerSession, right: TimerSession): number {
  return right.createdAtMs - left.createdAtMs;
}

function toState(sessions: unknown, activeId: unknown): TimerSessionState {
  const stored = Array.isArray(sessions) ? sessions : [];
  const valid = stored.flatMap((session: unknown) => (isTimerSession(session) ? [withTileOrder(session)] : [])).sort(byNewestSession);

  return { sessions: valid, activeId: pickActiveId(valid, activeId) };
}

/** A race written by a release that laid the tiles out in the screen reopens with an open order. */
function withTileOrder(session: StoredTimerSession): TimerSession {
  return { ...session, tileOrder: session.tileOrder ?? [] };
}

/** A pointer to a session that did not survive the shape check is no pointer at all. */
function pickActiveId(sessions: readonly TimerSession[], activeId: unknown): string | null {
  if (typeof activeId !== 'string') {
    return null;
  }

  return sessions.some((session) => session.id === activeId) ? activeId : null;
}

function isTimerSession(value: unknown): value is StoredTimerSession {
  return (
    isRecord(value) &&
    isStoredTileOrder(value['tileOrder']) &&
    isNonEmptyString(value['id']) &&
    typeof value['dateIso'] === 'string' &&
    typeof value['createdAtMs'] === 'number' &&
    isNullableNumber(value['startedAtEpochMs']) &&
    isNullableNumber(value['stoppedAtMs']) &&
    isOneOf(value['status'], TIMER_STATUS_VALUES) &&
    isOneOf(value['role'], TIMER_ROLE_VALUES) &&
    isArrayOf(value['runners'], isTimerRunner) &&
    isArrayOf(value['splits'], isTimerSplit) &&
    isPublishStatus(value['publish'])
  );
}

/** Missing is the ordinary case of an older payload; anything else in its place is a broken one. */
function isStoredTileOrder(value: unknown): value is string[] | undefined {
  return value === undefined || isArrayOf(value, isNonEmptyString);
}

function isTimerRunner(value: unknown): value is TimerRunner {
  return (
    isRecord(value) &&
    isNonEmptyString(value['id']) &&
    typeof value['fullName'] === 'string' &&
    isNullableString(value['athleteKey']) &&
    isNullableGender(value['gender']) &&
    isOneOf(value['outcome'], TIMER_RUNNER_OUTCOME_VALUES)
  );
}

function isTimerSplit(value: unknown): value is TimerSplit {
  return isRecord(value) && isNonEmptyString(value['id']) && typeof value['atMs'] === 'number' && isNullableString(value['runnerId']);
}

function isPublishStatus(value: unknown): value is TimerPublishStatus {
  return (
    isRecord(value) &&
    isOneOf(value['state'], TIMER_PUBLISH_STATE_VALUES) &&
    isNullableString(value['error']) &&
    isNullableString(value['sha'])
  );
}

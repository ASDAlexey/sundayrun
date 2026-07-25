import { TimerSessionState } from './timer-session.interface';
import { TimerStorage } from './timer-storage.type';

/** localStorage key of every measurement taken on this device (docs/TIMER.md §8). */
export const TIMER_SESSION_STORAGE_KEY = 'sundayrun.timer.v1';

/** Version of the stored payload; anything else was written by another release and is ignored. */
export const TIMER_SESSION_SCHEMA_VERSION = 1;

/** No stored payload, a broken one, or one of a foreign schema — the device simply has no measurements. */
export const EMPTY_TIMER_SESSION_STATE: TimerSessionState = { sessions: [], activeId: null };

/** Prerender has no localStorage and never records a race, so a stub of the used subset suffices. */
export const TIMER_SESSION_SSR_NOOP_STORAGE: TimerStorage = {
  getItem: () => null,
  setItem: () => undefined,
};

/** Prerender has no window either; the id it would build is never stored, so a fixed pair will do. */
export const TIMER_SESSION_SSR_NOW_MS = 0;

/** The `randomFn` stand-in of the same prerender path. */
export const TIMER_SESSION_SSR_RANDOM = 0;

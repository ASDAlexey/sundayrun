import { Signal, WritableSignal, computed, signal } from '@angular/core';
import { Mock, vi } from 'vitest';

import { TimerSession } from '../core/timer/timer-session.interface';
import { TIMER_SESSION_DATE_ISO } from '../core/timer/timer-session.mock';
import { CreateTimerSessionInput } from './timer-session.interface';

/** The shape the `timerSessionServiceMock` factory returns: signals the spec drives, spies it asserts on. */
export interface TimerSessionServiceMock {
  sessions: WritableSignal<TimerSession[]>;
  activeId: WritableSignal<string | null>;
  active: WritableSignal<TimerSession | null>;
  hasActive: Signal<boolean>;
  create: Mock;
  open: Mock;
  closeActive: Mock;
  remove: Mock;
  update: Mock;
  updateActive: Mock;
}

/**
 * A stubbed measurement store for the timer components: the four signals are writable, so a spec
 * puts a page into any state it needs, and every mutating call is a bare spy — the transitions
 * themselves are already covered by the pure core.
 */
export function timerSessionServiceMock(): TimerSessionServiceMock {
  const active = signal<TimerSession | null>(null);

  return {
    sessions: signal<TimerSession[]>([]),
    activeId: signal<string | null>(null),
    active,
    hasActive: computed(() => active() !== null),
    create: vi.fn(() => CREATED_TIMER_SESSION_ID),
    open: vi.fn(),
    closeActive: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
    updateActive: vi.fn(),
  };
}

/** The id the stubbed `create` hands back. */
export const CREATED_TIMER_SESSION_ID = 'session-created';

/** What «Новый забег» passes in: only the race date, the rest the service invents itself. */
export const CREATE_TIMER_SESSION_INPUT: CreateTimerSessionInput = { dateIso: TIMER_SESSION_DATE_ISO };

/** A second measurement created a tick later; its id must differ from the first one's. */
export const SECOND_CREATE_INPUT: CreateTimerSessionInput = { dateIso: '2026-08-02' };

/** The wall clock advances by a second between the two `create` calls of the spec. */
export const SECOND_CREATE_NOW_MS_STEP = 1_000;

/** An id no stored measurement carries — `open` and `remove` must ignore it in silence. */
export const UNKNOWN_TIMER_SESSION_ID = 'session-never-existed';

/** The date a refused change would have written; the point is that it never reaches the storage. */
export const REFUSED_CHANGE_DATE_ISO = '1999-12-31';

import { DOCUMENT, Injector, Service, computed, inject, signal } from '@angular/core';

import { createSession } from '../core/timer/session-actions';
import { createTimerId } from '../core/timer/timer-id';
import { NotificationService } from '../shared/notification/notification.service';
import {
  TIMER_SESSION_SSR_NOOP_STORAGE,
  TIMER_SESSION_SSR_NOW_MS,
  TIMER_SESSION_SSR_RANDOM,
  TIMER_SESSION_STORAGE_ERROR_MESSAGE,
  TIMER_SESSION_STORAGE_KEY,
} from './timer-session.constant';
import { CreateTimerSessionInput, TimerSessionState } from './timer-session.interface';
import { readTimerSessionState, serializeTimerSessionState } from './timer-session.storage';
import { TimerSessionChange } from './timer-session.type';
import { TimerStorage } from './timer-storage.type';

/**
 * Owns every measurement of this device and the pointer to the one currently open («Мои замеры»,
 * docs/TIMER.md §8). Every change lands in localStorage at once, with no debounce: a dropped tab, a
 * dead battery or a stray «закрыть» must cost nothing, and a race is over long before any debounce
 * window would be worth its risk. The transitions themselves belong to the pure core — this service
 * only supplies the ids and the clock, applies the returned session and writes it down. A callback
 * that returns the very same session (a refused tap) writes nothing at all.
 */
@Service()
export class TimerSessionService {
  readonly #view = inject(DOCUMENT).defaultView;
  /** Resolved on demand, like `NotifyingErrorHandler` does it: MatSnackBar has no business in a prerender. */
  readonly #injector = inject(Injector);
  readonly #state = signal<TimerSessionState>(readTimerSessionState(this.#storage.getItem(TIMER_SESSION_STORAGE_KEY)));

  readonly sessions = computed(() => this.#state().sessions);
  readonly activeId = computed(() => this.#state().activeId);
  readonly active = computed(() => this.#state().sessions.find((session) => session.id === this.#state().activeId) ?? null);
  readonly hasActive = computed(() => this.active() !== null);

  #persistenceRequested = false;
  #storageFailureReported = false;

  /** Starts a fresh measurement for the given race date and opens it; returns its local id. */
  create(input: CreateTimerSessionInput): string {
    const createdAtMs = this.#nowMs();
    const id = this.#nextId(createdAtMs);
    const session = createSession({ id, dateIso: input.dateIso, createdAtMs });

    this.#write({ sessions: [session, ...this.#state().sessions], activeId: id });

    return id;
  }

  /** Opens a stored measurement; an unknown id is ignored, as is one that is already open. */
  open(id: string): void {
    const state = this.#state();

    if (state.activeId === id || !state.sessions.some((session) => session.id === id)) {
      return;
    }

    this.#write({ ...state, activeId: id });
  }

  /** Back to the list; the measurement itself is untouched and keeps running. */
  closeActive(): void {
    const state = this.#state();

    if (state.activeId === null) {
      return;
    }

    this.#write({ ...state, activeId: null });
  }

  remove(id: string): void {
    const state = this.#state();

    if (!state.sessions.some((session) => session.id === id)) {
      return;
    }

    this.#write({
      sessions: state.sessions.filter((session) => session.id !== id),
      activeId: state.activeId === id ? null : state.activeId,
    });
  }

  /** Applies a pure core transition to one measurement; a refused change costs no serialisation. */
  update(id: string, change: TimerSessionChange): void {
    const state = this.#state();
    const current = state.sessions.find((session) => session.id === id);

    if (current === undefined) {
      return;
    }

    const next = change(current);

    if (next === current) {
      return;
    }

    this.#write({ ...state, sessions: state.sessions.map((session) => (session === current ? next : session)) });
  }

  updateActive(change: TimerSessionChange): void {
    const { activeId } = this.#state();

    if (activeId !== null) {
      this.update(activeId, change);
    }
  }

  /**
   * The signal first, the device second — the same order the reading side documents and the roster
   * cache already follows. A `setItem` that throws (a full quota, an origin where storage is denied)
   * would otherwise take the tap with it: the signal would never update, the split would vanish from
   * the screen, and every following tap on the finish line would throw again. Here it costs one
   * toast, said once, and the race carries on in memory.
   */
  #write(state: TimerSessionState): void {
    this.#state.set(state);

    try {
      this.#storage.setItem(TIMER_SESSION_STORAGE_KEY, serializeTimerSessionState(state));
      this.#requestPersistence();
    } catch {
      this.#reportStorageFailure();
    }
  }

  #reportStorageFailure(): void {
    if (this.#storageFailureReported) {
      return;
    }

    this.#storageFailureReported = true;
    this.#injector.get(NotificationService).error(TIMER_SESSION_STORAGE_ERROR_MESSAGE);
  }

  #nowMs(): number {
    return this.#view?.Date.now() ?? TIMER_SESSION_SSR_NOW_MS;
  }

  /** The randomness comes from the injected window too, so a spec knows the id in advance. */
  #nextId(createdAtMs: number): string {
    return createTimerId(createdAtMs, () => this.#view?.Math.random() ?? TIMER_SESSION_SSR_RANDOM);
  }

  /**
   * Asks the browser once, on the first write, to keep the measurements out of the eviction sweep
   * (docs/TIMER.md §8). A refusal changes nothing that matters — the data is in localStorage either
   * way — so an absent API and a rejected promise are both simply ignored.
   */
  #requestPersistence(): void {
    if (this.#persistenceRequested) {
      return;
    }

    this.#persistenceRequested = true;

    const manager = this.#view?.navigator.storage;

    if (manager?.persist === undefined) {
      return;
    }

    manager.persist().catch(() => undefined);
  }

  /** Live localStorage access, so specs can stub the global per scenario; absent during prerender. */
  get #storage(): TimerStorage {
    return typeof localStorage === 'undefined' ? TIMER_SESSION_SSR_NOOP_STORAGE : localStorage;
  }
}

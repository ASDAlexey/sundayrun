import { Component, computed, inject, input, linkedSignal, output, untracked } from '@angular/core';

import { formatRaceTime } from '../../../core/time/duration';
import { assignNextUnnamed, recordUnnamedSplit } from '../../../core/timer/session-actions';
import { nextSplitForRunner, runnerSplitTimesMs, runnerStage, unassignedSplits } from '../../../core/timer/session-splits';
import { createTimerId } from '../../../core/timer/timer-id';
import { TIMER_ID_RANDOM_RANGE } from '../../../core/timer/timer-id.constant';
import { LAP_SPLIT_INDEX } from '../../../core/timer/timer-session.constant';
import { TimerStatus } from '../../../core/timer/timer-session.enum';
import { TimerFeedback } from '../../../state/haptics.enum';
import { HapticsService } from '../../../state/haptics.service';
import { TimerClockService } from '../../../state/timer-clock.service';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerSheet } from '../handout-sheet/handout-sheet';
import { STAGE_OF_MODE, TIMER_TAPE_LAST_TARGET, TIMER_TAPE_NOBODY_WAITING, TIMER_TAPE_NO_REQUEST } from './tape-controls.constant';
import { TimerTapeMode, TimerTapeModeType } from './tape-controls.enum';
import { TimerTapeRunner } from './tape-controls.interface';
import { tapeHeadingText, tapeNobodyWaitingText, tapeQueueDoneText, tapeRunnerMetaText } from './tape-controls.text';
import { RaceTime } from '../../../shared/race-time/race-time';

/**
 * The safety net for a pack on the first lap (docs/TIMER.md §4): the big «ОТСЕЧКА» key writes a time
 * with no name on it, and the queue of nameless times is handed out afterwards — a tapped surname
 * takes the earliest time that can still be his.
 *
 * The component owns no session state: it reads the active measurement out of `TimerSessionService`
 * and pushes every change back through the pure core, so the journal stays the single source of truth
 * and a refused handout costs nothing. Its own signals only describe the sheet — which half is open.
 */
@Component({
  selector: 'app-timer-tape',
  imports: [TimerSheet, RaceTime],
  templateUrl: './tape-controls.html',
  styleUrl: './tape-controls.scss',
})
export class TimerTape {
  readonly #sessions = inject(TimerSessionService);
  readonly #clock = inject(TimerClockService);
  readonly #haptics = inject(HapticsService);

  /**
   * «Разобрать» on the publish card asks for the sheet from the outside. It is a rising counter rather
   * than a boolean, so the same request can be made twice — the organiser may have closed the sheet in
   * between, and a boolean that is already `true` would never open it again.
   */
  readonly openRequest = input(TIMER_TAPE_NO_REQUEST);

  /** The open sheet covers the tile grid, so the page is told when it opens (design §2.2). */
  readonly panelOpen = output<boolean>();

  /**
   * Which half of the handout is open, or `null` for a closed sheet. A queued time is either somebody's
   * lap or somebody's finish, and mixing both groups in one list is how a time ends up on the wrong
   * person: mid-race the same surname is a legitimate target for one of the two and a misstap for the
   * other. The two keys ask the question once, and the list answers only it.
   *
   * An outside «Разобрать» opens the group that still has people waiting — the lap while anybody is
   * out on it, the finish afterwards.
   */
  readonly mode = linkedSignal<number, TimerTapeModeType | null>({
    source: () => this.openRequest(),
    computation: (request, previous) =>
      request > TIMER_TAPE_NO_REQUEST ? (previous?.value ?? untracked(() => this.#defaultMode())) : null,
  });

  readonly open = computed(() => this.mode() !== null);

  readonly hasQueue = computed(() => {
    const session = this.#sessions.active();

    return session !== null && unassignedSplits(session).length > 0;
  });

  /**
   * The core refuses every split outside the race, so the key exists only inside it: before the mass
   * start there is nothing to cut yet, and past the finish nothing left to cut. It goes rather than
   * goes grey — a dead key has to explain itself, and there is no room on a phone for the sentence.
   */
  readonly canCut = computed(() => this.#sessions.active()?.status === TimerStatus.running);

  /**
   * Whom each half can hand a time to, and which time each of them takes. Only people the core would
   * actually accept it for: a runner who is done, a runner who was retired and a runner whose own lap
   * is later than everything left in the queue are not greyed out at the bottom of the list any more,
   * they are simply not in it — the list is a list of targets, not of the roster.
   *
   * Every row carries the time it is about to write, because a handout that shows only surnames is how
   * a finish lands earlier than the lap of the same man and nobody notices until the protocol.
   */
  readonly lapRows = computed(() => this.#rowsOf(TimerTapeMode.lap));
  readonly finishRows = computed(() => this.#rowsOf(TimerTapeMode.finish));

  /** How many people the lap key has to offer, and how many the finish key has. */
  readonly lapWaiting = computed(() => this.lapRows().length);
  readonly finishWaiting = computed(() => this.finishRows().length);

  readonly runners = computed<TimerTapeRunner[]>(() => {
    const mode = this.mode();

    if (mode === null) {
      return [];
    }

    return mode === TimerTapeMode.lap ? this.lapRows() : this.finishRows();
  });

  readonly heading = computed(() => {
    const mode = this.mode();

    return mode === null ? null : tapeHeadingText(mode);
  });

  /** Why the open half shows no names: an emptied queue first of all, then an emptied group. */
  readonly emptyText = computed(() => {
    const mode = this.mode();

    if (mode === null) {
      return null;
    }

    if (!this.hasQueue()) {
      return tapeQueueDoneText();
    }

    return this.runners().length > 0 ? null : tapeNobodyWaitingText(mode);
  });

  protected readonly modes = TimerTapeMode;

  #issued = 0;

  /** The cut is taken on `pointerdown`, so the recorded time is the one the finger meant. */
  onCut(): void {
    if (!this.canCut()) {
      return;
    }

    const atMs = this.#clock.nowMs();

    this.#sessions.updateActive((session) => recordUnnamedSplit(session, atMs, this.#nextId(atMs)));
    this.#haptics.play(TimerFeedback.lap);
  }

  /** `pointerdown` never arrives from a keyboard, so Enter and Space cut through here instead. */
  onKeyCut(event: Event): void {
    event.preventDefault();
    this.onCut();
  }

  /** The same key twice closes the sheet; the other key swaps the group without closing anything. */
  onToggle(mode: TimerTapeModeType): void {
    const next = this.mode() === mode ? null : mode;

    this.mode.set(next);
    this.panelOpen.emit(next !== null);
  }

  /** Escape, the backdrop or «Готово»: the sheet closes and the keys are on their own again. */
  onClose(): void {
    this.mode.set(null);
    this.panelOpen.emit(false);
  }

  /**
   * A tapped surname takes the earliest nameless time that can be his. Serving the last row closes
   * the sheet: that half has nothing left to ask about, and an empty list left on screen is read as
   * a handout that failed rather than as one that is finished.
   *
   * The row that a tap leaves alone is served with it. One surname against one queue is not a
   * question — nobody else in this half can be given that time — and the tap that answers it is
   * pure ceremony at the end of a handout done in the cold with wet gloves. Everything the organiser
   * could still get wrong stays a choice: two rows are two taps, and a half of one is left on
   * screen with its time until a tap sets the handout going.
   */
  onAssign(runnerId: string): void {
    const rest = this.runners().filter((runner) => runner.id !== runnerId);
    const [alone] = rest;

    this.#hand(runnerId);

    if (alone !== undefined && rest.length === TIMER_TAPE_LAST_TARGET) {
      this.#hand(alone.id);
    }

    if (rest.length <= TIMER_TAPE_LAST_TARGET) {
      this.onClose();
    }
  }

  /** One handout: the buzz that says it landed, and the change the journal keeps. */
  #hand(runnerId: string): void {
    this.#haptics.play(TimerFeedback.lap);
    this.#sessions.updateActive((session) => assignNextUnnamed(session, runnerId));
  }

  /** Where an outside «Разобрать» lands: the lap while anybody is still out on it, the finish after. */
  #defaultMode(): TimerTapeModeType {
    return this.lapRows().length > TIMER_TAPE_NOBODY_WAITING ? TimerTapeMode.lap : TimerTapeMode.finish;
  }

  #rowsOf(mode: TimerTapeModeType): TimerTapeRunner[] {
    const session = this.#sessions.active();

    if (session === null) {
      return [];
    }

    return session.runners.reduce<TimerTapeRunner[]>((rows, runner) => {
      const waiting = runnerStage(session, runner.id) === STAGE_OF_MODE[mode];
      const next = waiting ? nextSplitForRunner(session, runner.id) : undefined;

      if (next === undefined) {
        return rows;
      }

      const metaText = tapeRunnerMetaText(mode, runnerSplitTimesMs(session, runner.id)[LAP_SPLIT_INDEX]);

      return [...rows, { fullName: runner.fullName, id: runner.id, metaText, timeText: formatRaceTime(next.atMs) }];
    }, []);
  }

  /**
   * A split id from a counter rather than from `Math.random`: the tail only has to be unique inside
   * this measurement, a counter cannot repeat where randomness theoretically could, and the specs
   * need no stubbed globals to know the id in advance.
   */
  #nextId(atMs: number): string {
    this.#issued += 1;

    const issued = this.#issued;

    return createTimerId(atMs, () => issued / TIMER_ID_RANDOM_RANGE);
  }
}

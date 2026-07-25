import { Component, computed, inject, input, linkedSignal, output, signal, untracked } from '@angular/core';

import { formatDuration } from '../../../core/time/duration';
import { assignNextUnnamed, assignSplit, recordUnnamedSplit, removeSplit } from '../../../core/timer/session-actions';
import { runnerSplitTimesMs, runnerStage, unassignedSplits } from '../../../core/timer/session-splits';
import { createTimerId } from '../../../core/timer/timer-id';
import { TIMER_ID_RANDOM_RANGE } from '../../../core/timer/timer-id.constant';
import { LAP_SPLIT_INDEX } from '../../../core/timer/timer-session.constant';
import { TimerStatus } from '../../../core/timer/timer-session.enum';
import { TimerFeedback } from '../../../state/haptics.enum';
import { HapticsService } from '../../../state/haptics.service';
import { TimerClockService } from '../../../state/timer-clock.service';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerConfirm } from '../confirm-dialog/confirm-dialog';
import { STAGE_OF_MODE, TIMER_TAPE_NEXT_INDEX, TIMER_TAPE_NOBODY_WAITING, TIMER_TAPE_NO_REQUEST } from './tape-controls.constant';
import { TimerTapeMode, TimerTapeModeType } from './tape-controls.enum';
import { TimerTapeChip, TimerTapeDiscard, TimerTapeRunner } from './tape-controls.interface';
import { tapeDiscardNoteText, tapeKeysHintText, tapeNobodyWaitingText, tapeQueueDoneText, tapeRunnerMetaText } from './tape-controls.text';

/**
 * The safety net for a pack on the first lap (docs/TIMER.md §4): the big «ОТСЕЧКА» key writes a time
 * with no name on it, and the queue of nameless times is handed out afterwards — a tapped surname
 * takes the earliest one, or the chip the organiser picked by hand.
 *
 * The component owns no session state: it reads the active measurement out of `TimerSessionService`
 * and pushes every change back through the pure core, so the journal stays the single source of truth
 * and a refused handout costs nothing. Its own signals only describe the panel — what is open, what
 * is picked, what is being held down.
 */
@Component({
  selector: 'app-timer-tape',
  imports: [TimerConfirm],
  templateUrl: './tape-controls.html',
  styleUrl: './tape-controls.scss',
})
export class TimerTape {
  readonly #sessions = inject(TimerSessionService);
  readonly #clock = inject(TimerClockService);
  readonly #haptics = inject(HapticsService);

  /**
   * «Разобрать» on the publish card asks for the panel from the outside. It is a rising counter rather
   * than a boolean, so the same request can be made twice — the organiser may have closed the panel in
   * between, and a boolean that is already `true` would never open it again.
   */
  readonly openRequest = input(TIMER_TAPE_NO_REQUEST);

  /** The open queue panel eats a row of the tile grid, so the page is told when it opens (design §2.2). */
  readonly panelOpen = output<boolean>();

  /**
   * Which half of the handout is open, or `null` for a closed panel. A queued time is either somebody's
   * lap or somebody's finish, and mixing both groups in one list is how a time ends up on the wrong
   * person: mid-race the same surname is a legitimate target for one of the two and a misstap for the
   * other. The two keys ask the question once, and the list below answers only it.
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

  readonly pickedId = signal<string | null>(null);
  /** The time text of a chip that has just been handed out — a ghost that flies away and dies. */
  readonly flyingText = signal<string | null>(null);

  /**
   * The «Выбросить время?» question in flight: the chip it is about and the words that name it. The
   * text is built where the chip is still in hand, so the dialog needs no fallback for a queue that
   * has moved on underneath it.
   */
  readonly discardAsk = signal<TimerTapeDiscard | null>(null);

  readonly queue = computed<TimerTapeChip[]>(() => {
    const session = this.#sessions.active();

    if (session === null) {
      return [];
    }

    const picked = this.pickedId();

    return unassignedSplits(session).map((split, index) => ({
      id: split.id,
      next: picked === null ? index === TIMER_TAPE_NEXT_INDEX : split.id === picked,
      selected: split.id === picked,
      timeText: formatDuration(split.atMs),
    }));
  });

  readonly hasQueue = computed(() => this.queue().length > 0);
  readonly queueCount = computed(() => this.queue().length);
  /** The queue row survives an emptied queue for as long as the ghost of the last chip is still flying. */
  readonly showQueue = computed(() => this.hasQueue() || this.flyingText() !== null);
  readonly pickedChip = computed(() => this.queue().find((chip) => chip.selected) ?? null);
  /** The core refuses every split until the mass start, so the key says so instead of pretending. */
  readonly canCut = computed(() => this.#sessions.active()?.status === TimerStatus.running);
  /**
   * A stopped race has nothing left to cut, and the core would refuse anyway. The key goes rather
   * than goes grey: past the finish the panel exists only to hand out the times still without a name.
   */
  readonly finished = computed(() => this.#sessions.active()?.status === TimerStatus.finished);
  readonly keysHint = computed(() => (this.finished() ? null : tapeKeysHintText(this.canCut())));

  /** How many people the lap key has to offer, and how many the finish key has. */
  readonly lapWaiting = computed(() => this.#waitingCount(TimerTapeMode.lap));
  readonly finishWaiting = computed(() => this.#waitingCount(TimerTapeMode.finish));

  /**
   * Whom the open half can hand a time to. Only people the core would actually accept it for: a runner
   * who is done and a runner who was retired are not greyed out at the bottom of the list any more,
   * they are simply not in it — the list is a list of targets, not of the roster.
   */
  readonly runners = computed<TimerTapeRunner[]>(() => {
    const session = this.#sessions.active();
    const mode = this.mode();

    if (session === null || mode === null) {
      return [];
    }

    return session.runners.reduce<TimerTapeRunner[]>((rows, runner) => {
      if (runnerStage(session, runner.id) !== STAGE_OF_MODE[mode]) {
        return rows;
      }

      const metaText = tapeRunnerMetaText(mode, runnerSplitTimesMs(session, runner.id)[LAP_SPLIT_INDEX]);

      return [...rows, { fullName: runner.fullName, id: runner.id, metaText }];
    }, []);
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

  /** The same key twice closes the panel; the other key swaps the group without closing anything. */
  onToggle(mode: TimerTapeModeType): void {
    const next = this.mode() === mode ? null : mode;

    this.mode.set(next);
    this.panelOpen.emit(next !== null);
    this.#reset();
  }

  /** Picking a chip twice puts the queue back in order — the head chip is next again. */
  onPick(splitId: string): void {
    this.pickedId.set(this.pickedId() === splitId ? null : splitId);
  }

  /** A tapped surname takes the picked chip, or the earliest nameless time when nothing is picked. */
  onAssign(runnerId: string): void {
    const picked = this.pickedChip();
    const chip = picked ?? this.queue()[TIMER_TAPE_NEXT_INDEX];

    if (chip === undefined) {
      return;
    }

    this.flyingText.set(chip.timeText);
    this.#haptics.play(TimerFeedback.lap);
    this.#reset();
    this.#sessions.updateActive((session) =>
      picked === null ? assignNextUnnamed(session, runnerId) : assignSplit(session, chip.id, runnerId),
    );
  }

  onFlyEnd(): void {
    this.flyingText.set(null);
  }

  /** Throwing a time away is asked about by name first: a stray tap must not empty the queue. */
  onDiscardAsk(chip: TimerTapeChip): void {
    this.discardAsk.set({ id: chip.id, note: tapeDiscardNoteText(chip.timeText) });
  }

  onDiscard(splitId: string): void {
    this.discardAsk.set(null);
    this.#haptics.play(TimerFeedback.cancel);
    this.#reset();
    this.#sessions.updateActive((session) => removeSplit(session, splitId));
  }

  #reset(): void {
    this.pickedId.set(null);
  }

  /** Where an outside «Разобрать» lands: the lap while anybody is still out on it, the finish after. */
  #defaultMode(): TimerTapeModeType {
    return this.lapWaiting() > TIMER_TAPE_NOBODY_WAITING ? TimerTapeMode.lap : TimerTapeMode.finish;
  }

  #waitingCount(mode: TimerTapeModeType): number {
    const session = this.#sessions.active();

    if (session === null) {
      return TIMER_TAPE_NOBODY_WAITING;
    }

    return session.runners.filter((runner) => runnerStage(session, runner.id) === STAGE_OF_MODE[mode]).length;
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

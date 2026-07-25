import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';

import { formatDuration } from '../../../core/time/duration';
import { assignNextUnnamed, assignSplit, recordUnnamedSplit, removeSplit } from '../../../core/timer/session-actions';
import { runnerSplits, unassignedSplits } from '../../../core/timer/session-splits';
import { createTimerId } from '../../../core/timer/timer-id';
import { TIMER_ID_RANDOM_RANGE } from '../../../core/timer/timer-id.constant';
import { LAST_ENTRY_INDEX, MAX_SPLITS_PER_RUNNER } from '../../../core/timer/timer-session.constant';
import { TimerStatus } from '../../../core/timer/timer-session.enum';
import { TimerFeedback } from '../../../state/haptics.enum';
import { HapticsService } from '../../../state/haptics.service';
import { TimerClockService } from '../../../state/timer-clock.service';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerConfirm } from '../confirm-dialog/confirm-dialog';
import { TIMER_TAPE_NEXT_INDEX, TIMER_TAPE_NO_REQUEST } from './tape-controls.constant';
import { TimerTapeChip, TimerTapeDiscard, TimerTapeRunner } from './tape-controls.interface';
import { tapeDiscardNoteText, tapeKeysHintText, tapeRunnerMetaText } from './tape-controls.text';

/**
 * The safety net for a pack on the first lap (docs/TIMER.md §4): the big «ОТСЕЧКА» key writes a time
 * with no name on it, «+ ещё один» hangs one more on the very same time for a chest-to-chest pair,
 * and the queue of nameless times is handed out afterwards — a tapped surname takes the earliest one,
 * or the chip the organiser picked by hand.
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  readonly open = linkedSignal<number, boolean>({
    source: () => this.openRequest(),
    computation: (request) => request > TIMER_TAPE_NO_REQUEST,
  });

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
  readonly canRepeat = computed(() => this.#lastSplitAtMs() !== null);
  /** The core refuses every split until the mass start, so both keys say so instead of pretending. */
  readonly canCut = computed(() => this.#sessions.active()?.status === TimerStatus.running);
  /**
   * A stopped race has nothing left to cut, and the core would refuse anyway. The keys go rather
   * than go grey: past the finish the panel exists only to hand out the times still without a name.
   */
  readonly finished = computed(() => this.#sessions.active()?.status === TimerStatus.finished);
  readonly keysHint = computed(() => (this.finished() ? null : tapeKeysHintText(this.canCut(), this.canRepeat())));

  readonly runners = computed<TimerTapeRunner[]>(() => {
    const session = this.#sessions.active();

    if (session === null) {
      return [];
    }

    return session.runners.map((runner) => {
      const splitCount = runnerSplits(session, runner.id).length;

      return {
        fullName: runner.fullName,
        id: runner.id,
        metaText: tapeRunnerMetaText(splitCount),
        taken: splitCount >= MAX_SPLITS_PER_RUNNER,
      };
    });
  });

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

  /** «+ ещё один»: one more nameless time on the newest journal entry — they came in chest to chest. */
  onRepeat(): void {
    const atMs = this.#lastSplitAtMs();

    if (atMs === null) {
      return;
    }

    this.#sessions.updateActive((session) => recordUnnamedSplit(session, atMs, this.#nextId(atMs)));
    this.#haptics.play(TimerFeedback.lap);
  }

  onToggle(): void {
    const open = !this.open();

    this.open.set(open);
    this.panelOpen.emit(open);

    if (!open) {
      this.#reset();
    }
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

  #lastSplitAtMs(): number | null {
    return this.#sessions.active()?.splits.at(LAST_ENTRY_INDEX)?.atMs ?? null;
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

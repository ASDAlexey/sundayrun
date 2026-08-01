import { Component, computed, inject, output, signal } from '@angular/core';

import { formatRaceTime } from '../../../core/time/duration';
import { reassignSplit, removeSplit, setRunnerOutcome, unassignSplit } from '../../../core/timer/session-actions';
import { FIRST_POSITION } from '../../../core/timer/timer-session.constant';
import { TimerRunnerOutcome, TimerRunnerOutcomeType } from '../../../core/timer/timer-session.enum';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerConfirm } from '../confirm-dialog/confirm-dialog';
import { TimerSheet } from '../handout-sheet/handout-sheet';
import { TimerHistoryEntry, TimerHistoryRemove, TimerHistoryRunner } from './session-history.interface';
import { historyCardLabelText, historyRemoveNoteText } from './session-history.text';
import { RaceTime } from '../../../shared/race-time/race-time';

/**
 * The full journal of taps, and the only place it can be corrected by hand (docs/TIMER.md §4). Every
 * fix goes through the pure core and lands in the measurement at once, well before anything is
 * published: a time can change owner, go back to the nameless queue or be thrown away, and a runner
 * can be marked as retired or as somebody who only ran the lap — that is a result edit too.
 *
 * Which rows were touched is remembered here rather than in the session: the model has no «edited»
 * flag by design, and the mark is only there to help the eye find its own corrections in this sitting.
 *
 * A modal `<dialog>` (`TimerSheet`) and not a pane of the race: correcting the journal is a sitting
 * of its own, and the tiles behind it must not take a tap while it lasts. It also settles what the
 * markup used to only claim — `role="dialog"` without a scrim, a focus trap or a working Escape.
 */
@Component({
  selector: 'app-timer-history',
  imports: [TimerConfirm, RaceTime, TimerSheet],
  templateUrl: './session-history.html',
  styleUrl: './session-history.scss',
})
export class TimerHistory {
  readonly #sessions = inject(TimerSessionService);

  readonly close = output<void>();

  /**
   * Whose card the organiser asked for. The journal only names him: which card is open is state of
   * the screen, and the screen already owns it for the long press on a tile.
   */
  readonly card = output<string>();

  readonly expandedId = signal<string | null>(null);
  /** The «Удалить отсечку?» question in flight — the entry it is about and the words that name it. */
  readonly removeAsk = signal<TimerHistoryRemove | null>(null);
  readonly editedIds = signal<ReadonlySet<string>>(new Set());

  readonly entries = computed<TimerHistoryEntry[]>(() => {
    const session = this.#sessions.active();

    if (session === null) {
      return [];
    }

    const edited = this.editedIds();

    return session.splits.map((split, index) => {
      const owner = session.runners.find((runner) => runner.id === split.runnerId);

      return {
        edited: edited.has(split.id),
        id: split.id,
        index: index + FIRST_POSITION,
        orphan: split.runnerId === null,
        ownerName: owner?.fullName ?? null,
        timeText: formatRaceTime(split.atMs),
      };
    });
  });

  readonly hasEntries = computed(() => this.entries().length > 0);

  readonly runners = computed<TimerHistoryRunner[]>(() => {
    const session = this.#sessions.active();

    if (session === null) {
      return [];
    }

    return session.runners.map((runner) => ({
      cardLabel: historyCardLabelText(runner.fullName),
      fullName: runner.fullName,
      id: runner.id,
      outcome: runner.outcome,
    }));
  });

  protected readonly outcomes = TimerRunnerOutcome;

  /**
   * «✕». The dialog is closed by hand and not merely unmounted: only `close()` gives the focus back
   * to the menu item that opened the journal, while a modal torn out of the DOM drops it on `<body>`.
   * Escape and the backdrop never reach here — the dialog closes itself and only reports it.
   */
  onClose(sheet: HTMLDialogElement): void {
    sheet.close();
    this.close.emit();
  }

  /** Tapping the owner opens the roster for that entry; tapping it again folds it back. */
  onExpand(splitId: string): void {
    this.expandedId.set(this.expandedId() === splitId ? null : splitId);
  }

  /** «Тапнул не того»: the time moves to another runner, one time at a time. */
  onReassign(splitId: string, runnerId: string): void {
    this.expandedId.set(null);
    this.#markEdited(splitId);
    this.#sessions.updateActive((session) => reassignSplit(session, splitId, runnerId));
  }

  onUnassign(splitId: string): void {
    this.#markEdited(splitId);
    this.#sessions.updateActive((session) => unassignSplit(session, splitId));
  }

  /**
   * The card of one runner, from a list that is already there and already reachable with a keyboard.
   * It is the only home of «Поменять местами с…», and its other door — a long press on the right
   * tile — is a gesture a cold thumb on a start line cannot be relied on to make.
   */
  onCard(runnerId: string): void {
    this.card.emit(runnerId);
  }

  onOutcome(runnerId: string, outcome: TimerRunnerOutcomeType): void {
    this.#sessions.updateActive((session) => setRunnerOutcome(session, runnerId, outcome));
  }

  /** Dropping an entry is asked about first: a stray tap must not shorten the journal. */
  onRemoveAsk(entry: TimerHistoryEntry): void {
    this.removeAsk.set({ id: entry.id, note: historyRemoveNoteText(entry.index, entry.timeText, entry.ownerName) });
  }

  onRemove(splitId: string): void {
    this.removeAsk.set(null);
    this.expandedId.set(null);
    this.#sessions.updateActive((session) => removeSplit(session, splitId));
  }

  #markEdited(splitId: string): void {
    this.editedIds.set(new Set([...this.editedIds(), splitId]));
  }
}

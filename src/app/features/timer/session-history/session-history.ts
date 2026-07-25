import { Component, computed, inject, output, signal } from '@angular/core';

import { formatDuration } from '../../../core/time/duration';
import { reassignSplit, removeSplit, setRunnerOutcome, unassignSplit } from '../../../core/timer/session-actions';
import { FIRST_POSITION } from '../../../core/timer/timer-session.constant';
import { TimerRunnerOutcome, TimerRunnerOutcomeType } from '../../../core/timer/timer-session.enum';
import { TimerSessionService } from '../../../state/timer-session.service';
import { TimerConfirm } from '../confirm-dialog/confirm-dialog';
import { TimerHistoryEntry, TimerHistoryRemove, TimerHistoryRunner } from './session-history.interface';
import { historyRemoveNoteText } from './session-history.text';

/**
 * The full journal of taps, and the only place it can be corrected by hand (docs/TIMER.md §4). Every
 * fix goes through the pure core and lands in the measurement at once, well before anything is
 * published: a time can change owner, go back to the nameless queue or be thrown away, and a runner
 * can be marked as retired or as somebody who only ran the lap — that is a result edit too.
 *
 * Which rows were touched is remembered here rather than in the session: the model has no «edited»
 * flag by design, and the mark is only there to help the eye find its own corrections in this sitting.
 */
@Component({
  selector: 'app-timer-history',
  imports: [TimerConfirm],
  templateUrl: './session-history.html',
  styleUrl: './session-history.scss',
})
export class TimerHistory {
  readonly #sessions = inject(TimerSessionService);

  readonly close = output<void>();

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
        timeText: formatDuration(split.atMs),
      };
    });
  });

  readonly hasEntries = computed(() => this.entries().length > 0);

  readonly runners = computed<TimerHistoryRunner[]>(() => {
    const session = this.#sessions.active();

    if (session === null) {
      return [];
    }

    return session.runners.map((runner) => ({ fullName: runner.fullName, id: runner.id, outcome: runner.outcome }));
  });

  protected readonly outcomes = TimerRunnerOutcome;

  onClose(): void {
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

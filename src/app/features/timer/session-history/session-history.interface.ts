import { TimerRunnerOutcomeType } from '../../../core/timer/timer-session.enum';

/** One journal entry as the history shows it. */
export interface TimerHistoryEntry {
  /** Whether the organiser has already corrected this entry by hand in this sitting. */
  edited: boolean;
  id: string;
  /** Position in the journal, counted from one — the number the organiser refers to out loud. */
  index: number;
  /** Whether the time is still waiting for a name. */
  orphan: boolean;
  ownerName: string | null;
  timeText: string;
}

/** The «Удалить отсечку?» question in flight: which entry it is about and how it words the loss. */
export interface TimerHistoryRemove {
  id: string;
  note: string;
}

/** One roster line of the history: the reassignment target and the owner of an outcome. */
export interface TimerHistoryRunner {
  /** «Карточка: Ширшов Денис» — precomputed, because a template must not call a function. */
  cardLabel: string;
  fullName: string;
  id: string;
  outcome: TimerRunnerOutcomeType;
}

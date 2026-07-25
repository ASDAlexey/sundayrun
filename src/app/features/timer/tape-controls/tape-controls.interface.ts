/** One queued time as the tape shows it. */
export interface TimerTapeChip {
  id: string;
  /** Whether this chip is the one an ordered handout gives away next — filled with the accent. */
  next: boolean;
  /** Whether the organiser picked this chip by hand instead of taking the queue in order. */
  selected: boolean;
  timeText: string;
}

/** The «Выбросить время?» question in flight: which entry it is about and how it words the loss. */
export interface TimerTapeDiscard {
  id: string;
  note: string;
}

/** One row of the handout list. */
export interface TimerTapeRunner {
  fullName: string;
  id: string;
  /** What is already written down for him — so a dead row explains itself instead of just refusing. */
  metaText: string;
  /** Both of his times are recorded: the core would refuse the handout, so the row is disabled. */
  taken: boolean;
}

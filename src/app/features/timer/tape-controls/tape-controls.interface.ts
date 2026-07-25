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

/** One row of the handout list — always a runner the open half can actually give the time to. */
export interface TimerTapeRunner {
  fullName: string;
  id: string;
  /** «круг 11:41» while handing out finishes: the time he already has, to recognise him by. */
  metaText: string;
}

/** One row of the handout list — always a runner the open half can actually give the time to. */
export interface TimerTapeRunner {
  fullName: string;
  id: string;
  /** «круг 11:41» while handing out finishes: the time he already has, to recognise him by. */
  metaText: string;
  /** The queued time this row writes — shown so a finish earlier than its own lap is seen, not found. */
  timeText: string;
}

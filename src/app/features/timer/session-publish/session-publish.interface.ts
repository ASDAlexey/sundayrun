/** How one line of the progress list looks right now: the current step, an already passed one, or neither. */
export interface TimerPublishStepView {
  active: boolean;
  done: boolean;
}

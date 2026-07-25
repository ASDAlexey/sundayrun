/**
 * Which half of the handout is open. A queued time becomes either somebody's first lap or somebody's
 * finish, and the two never mix in one list: on the lap the organiser is looking for people who have
 * not been tapped at all, on the finish for people who already have a lap (docs/TIMER.md §4).
 */
export const TimerTapeMode = { lap: 'lap', finish: 'finish' } as const;
export type TimerTapeModeType = (typeof TimerTapeMode)[keyof typeof TimerTapeMode];

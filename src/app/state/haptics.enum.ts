/**
 * The tactile vocabulary of the stopwatch (docs/TIMER.md §10). Every entry has its own rhythm, so a
 * thumb can tell what happened without looking at the screen: a lap is not a finish, and neither of
 * them is a refusal.
 */
export const TimerFeedback = {
  cancel: 'cancel',
  error: 'error',
  finish: 'finish',
  lap: 'lap',
  start: 'start',
} as const;
export type TimerFeedbackType = (typeof TimerFeedback)[keyof typeof TimerFeedback];

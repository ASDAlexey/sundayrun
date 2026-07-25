/**
 * Where a publication stands, step by step — the text under the progress on `/timer`
 * («считаю примечания» → «отправляю» → «ждём деплой», docs/TIMER.md §8). `TimerPublishState` in the
 * core stays the coarse, stored status; this one only ever lives in memory.
 */
export const TimerPublishStep = {
  idle: 'idle',
  notes: 'notes',
  committing: 'committing',
  deploying: 'deploying',
  done: 'done',
  failed: 'failed',
} as const;
export type TimerPublishStepType = (typeof TimerPublishStep)[keyof typeof TimerPublishStep];

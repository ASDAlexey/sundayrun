/**
 * The state of the athlete directory behind «Кто бежит». `idle` means nothing has been read yet;
 * `ready` also covers a directory restored from the offline cache, so the sheet opens with names in
 * the park before any network call resolves. `error` never empties what is already loaded.
 */
export const TimerRosterStatus = {
  idle: 'idle',
  loading: 'loading',
  ready: 'ready',
  error: 'error',
} as const;

export type TimerRosterStatusType = (typeof TimerRosterStatus)[keyof typeof TimerRosterStatus];

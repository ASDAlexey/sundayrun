export const RacesStatus = {
  loading: 'loading',
  ready: 'ready',
  empty: 'empty',
  error: 'error',
} as const;

export type RacesStatusType = (typeof RacesStatus)[keyof typeof RacesStatus];

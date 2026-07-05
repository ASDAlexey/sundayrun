export const RaceStatus = {
  loading: 'loading',
  ready: 'ready',
  notFound: 'notFound',
  error: 'error',
} as const;

export type RaceStatusType = (typeof RaceStatus)[keyof typeof RaceStatus];

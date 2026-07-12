/** The athletes directory feeding the search box. */
export const VersusStatus = {
  loading: 'loading',
  ready: 'ready',
  error: 'error',
} as const;

export type VersusStatusType = (typeof VersusStatus)[keyof typeof VersusStatus];

/** The duel itself: `idle` until both slots are filled. */
export const DuelStatus = {
  idle: 'idle',
  loading: 'loading',
  ready: 'ready',
  notFound: 'notFound',
  error: 'error',
} as const;

export type DuelStatusType = (typeof DuelStatus)[keyof typeof DuelStatus];

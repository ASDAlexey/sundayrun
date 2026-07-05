export const AthletesStatus = {
  loading: 'loading',
  ready: 'ready',
  empty: 'empty',
  error: 'error',
} as const;

export type AthletesStatusType = (typeof AthletesStatus)[keyof typeof AthletesStatus];

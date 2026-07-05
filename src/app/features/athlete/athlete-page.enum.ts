export const AthleteStatus = {
  loading: 'loading',
  ready: 'ready',
  notFound: 'notFound',
  error: 'error',
} as const;

export type AthleteStatusType = (typeof AthleteStatus)[keyof typeof AthleteStatus];

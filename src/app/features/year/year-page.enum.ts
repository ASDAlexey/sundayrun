export const YearStatus = {
  loading: 'loading',
  ready: 'ready',
  notFound: 'notFound',
  error: 'error',
} as const;

export type YearStatusType = (typeof YearStatus)[keyof typeof YearStatus];

export const RecordsStatus = {
  loading: 'loading',
  ready: 'ready',
  empty: 'empty',
  error: 'error',
} as const;

export type RecordsStatusType = (typeof RecordsStatus)[keyof typeof RecordsStatus];

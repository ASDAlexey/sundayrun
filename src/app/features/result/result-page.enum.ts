export const ResultStatus = {
  generating: 'generating',
  ready: 'ready',
  error: 'error',
} as const;

export type ResultStatusType = (typeof ResultStatus)[keyof typeof ResultStatus];

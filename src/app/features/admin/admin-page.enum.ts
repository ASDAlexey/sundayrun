export const TokenSaveStatus = {
  idle: 'idle',
  empty: 'empty',
  checking: 'checking',
  valid: 'valid',
  unauthorized: 'unauthorized',
  error: 'error',
} as const;

export type TokenSaveStatusType = (typeof TokenSaveStatus)[keyof typeof TokenSaveStatus];

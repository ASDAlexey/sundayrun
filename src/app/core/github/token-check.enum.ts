export const TokenCheck = {
  valid: 'valid',
  unauthorized: 'unauthorized',
  error: 'error',
} as const;

export type TokenCheckType = (typeof TokenCheck)[keyof typeof TokenCheck];

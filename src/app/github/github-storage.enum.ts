export const PublishState = {
  idle: 'idle',
  publishing: 'publishing',
  success: 'success',
  authError: 'authError',
  error: 'error',
} as const;

export type PublishStateType = (typeof PublishState)[keyof typeof PublishState];

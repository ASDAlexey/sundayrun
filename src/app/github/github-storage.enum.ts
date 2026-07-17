export const PublishState = {
  idle: 'idle',
  publishing: 'publishing',
  success: 'success',
  // Delete only: the data commit landed but the version pointer has not caught up yet — the event is
  // gone, the change is still propagating. Reported softly, never as an error.
  pending: 'pending',
  authError: 'authError',
  error: 'error',
} as const;

export type PublishStateType = (typeof PublishState)[keyof typeof PublishState];

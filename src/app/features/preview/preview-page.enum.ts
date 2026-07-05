/** Lifecycle of the "apply history notes" action; a successful apply returns to `idle`. */
export const HistoryNotesStatus = {
  idle: 'idle',
  loading: 'loading',
  error: 'error',
} as const;

export type HistoryNotesStatusType = (typeof HistoryNotesStatus)[keyof typeof HistoryNotesStatus];

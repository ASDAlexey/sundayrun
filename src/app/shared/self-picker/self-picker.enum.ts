/** The athlete directory load inside the dropdown: nothing happens until the visitor opens it. */
export const SelfPickerStatus = {
  idle: 'idle',
  loading: 'loading',
  ready: 'ready',
  error: 'error',
} as const;

export type SelfPickerStatusType = (typeof SelfPickerStatus)[keyof typeof SelfPickerStatus];

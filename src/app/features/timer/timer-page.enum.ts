/**
 * The three views of one race screen. They are a filter over the same session, not modes: a tap on
 * a tile records the right split whichever tab is open (docs/TIMER.md §4).
 */
export const TimerTab = { grid: 'grid', lap: 'lap', finish: 'finish' } as const;
export type TimerTabType = (typeof TimerTab)[keyof typeof TimerTab];

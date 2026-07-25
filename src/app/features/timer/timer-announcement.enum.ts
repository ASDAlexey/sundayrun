/**
 * What the screen reader is told after a gesture. One phrase per action and no more — the digits
 * themselves stay silent, they change ten times a second (docs/TIMER.md §10, design spec §8.4).
 */
export const TimerAnnouncementKind = { finish: 'finish', lap: 'lap', undo: 'undo' } as const;
export type TimerAnnouncementKindType = (typeof TimerAnnouncementKind)[keyof typeof TimerAnnouncementKind];

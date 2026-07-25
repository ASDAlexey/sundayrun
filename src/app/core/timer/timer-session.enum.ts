export const TimerStatus = { idle: 'idle', running: 'running', finished: 'finished' } as const;
export type TimerStatusType = (typeof TimerStatus)[keyof typeof TimerStatus];

/** Second-judge roles; only `main` has a UI in the first release (docs/TIMER.md §6, §13). */
export const TimerRole = { main: 'main', backup: 'backup', order: 'order' } as const;
export type TimerRoleType = (typeof TimerRole)[keyof typeof TimerRole];

/** How a runner's race ended. `active` until the organiser says otherwise. */
export const TimerRunnerOutcome = { active: 'active', dnf: 'dnf', lapOnly: 'lapOnly' } as const;
export type TimerRunnerOutcomeType = (typeof TimerRunnerOutcome)[keyof typeof TimerRunnerOutcome];

export const TimerPublishState = { local: 'local', pending: 'pending', published: 'published', failed: 'failed' } as const;
export type TimerPublishStateType = (typeof TimerPublishState)[keyof typeof TimerPublishState];

/** Where a runner stands right now — drives the tile's colour coding. */
export const TimerRunnerStage = {
  waitingLap: 'waitingLap',
  waitingFinish: 'waitingFinish',
  finished: 'finished',
  retired: 'retired',
} as const;
export type TimerRunnerStageType = (typeof TimerRunnerStage)[keyof typeof TimerRunnerStage];

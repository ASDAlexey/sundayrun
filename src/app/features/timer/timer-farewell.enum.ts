/**
 * The three states of the one orchestrated moment of a race (docs/TIMER.md §10): nothing happening,
 * the tiles going out in a wave, and the protocol standing in their place.
 */
export const TimerFarewellPhase = { idle: 'idle', waving: 'waving', settled: 'settled' } as const;
export type TimerFarewellPhaseType = (typeof TimerFarewellPhase)[keyof typeof TimerFarewellPhase];

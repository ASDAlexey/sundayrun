/**
 * Resolved tile size of the grid. The four steps are the ones the vertical budget of a 390 × 844
 * phone allows without a scrollbar: 2 × 72, 3 × 64, 3 × 56 and 4 × 56 px.
 */
export const TimerDensity = { large: 'large', medium: 'medium', small: 'small', dense: 'dense' } as const;
export type TimerDensityType = (typeof TimerDensity)[keyof typeof TimerDensity];

/** What the «⋮» menu offers: «крупно / средне / плотно» plus the automatic default. */
export const TimerDensityChoice = { auto: 'auto', large: 'large', medium: 'medium', dense: 'dense' } as const;
export type TimerDensityChoiceType = (typeof TimerDensityChoice)[keyof typeof TimerDensityChoice];

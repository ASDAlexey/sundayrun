/** The three pacing archetypes: speeds up on lap 2, holds an even pace, or starts fast and fades. */
export const PacingProfile = {
  negative: 'negative',
  even: 'even',
  fade: 'fade',
} as const;

export type PacingProfileType = (typeof PacingProfile)[keyof typeof PacingProfile];

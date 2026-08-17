/**
 * How a stretch of the run compares with the run's own average pace.
 *
 * Relative to the athlete, not to anybody else: the whole card is one person's morning, and a
 * scale pinned to some absolute idea of «fast» would paint every kilometre of a slower runner red
 * and every kilometre of a quicker one green, which says nothing about how either race was run.
 */
export const PaceTone = {
  fastest: 'fastest',
  fast: 'fast',
  even: 'even',
  slow: 'slow',
  slowest: 'slowest',
} as const;

export type PaceToneType = (typeof PaceTone)[keyof typeof PaceTone];

/** The drawn art families of the badge chips; several badges can share one drawing. */
export const YearBadgeArt = {
  medal: 'medal',
  wheel: 'wheel',
  flake: 'flake',
  crown: 'crown',
  podium: 'podium',
  laurel: 'laurel',
  loop: 'loop',
  heart: 'heart',
} as const;

export type YearBadgeArtType = (typeof YearBadgeArt)[keyof typeof YearBadgeArt];

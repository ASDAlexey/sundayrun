/**
 * Where a personal track came from.
 *
 * Coros is the first watch account the site can talk to; Strava and Garmin are meant to land
 * beside it, so everything stored keeps the source rather than assuming one provider.
 */
export const TrackSource = {
  Coros: 'coros',
} as const;

export type TrackSourceType = (typeof TrackSource)[keyof typeof TrackSource];

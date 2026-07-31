import { TrackSourceType } from './track-source.enum';

/**
 * One race track, as it lives on this device and nowhere else.
 *
 * The GPX is kept gzipped: a 5 km recording at 1 Hz is around 440 KB of XML, and a few seasons
 * of them would outgrow any quota worth relying on.
 */
export interface AthleteTrack {
  /** Race slug — one track per race, whichever provider it arrived from. */
  slug: string;
  source: TrackSourceType;
  /** The provider's own id, so a re-sync recognises what it already has. */
  activityId: string;
  dateIso: string;
  distanceM: number;
  totalTimeS: number;
  gpxGzip: Uint8Array;
  savedAtIso: string;
}

/**
 * A race day already asked about and found empty.
 *
 * Without this the sync would re-ask the provider about every trackless race on every visit.
 * A day is not closed on the first miss, though: people upload from the watch hours or days
 * after the race, so an empty answer is retried a few times before the date is given up on.
 */
export interface TrackDayCheck {
  dateIso: string;
  source: TrackSourceType;
  checkedAtIso: string;
  attempts: number;
}

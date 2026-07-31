import { AthleteTrack, TrackDayCheck } from './athlete-track.interface';
import { TrackSource } from './track-source.enum';

export const TRACK_SLUG_MOCK = '2026-07-26';

export const TRACK_SAVED_AT_ISO_MOCK = '2026-07-27T19:33:00.000Z';

export const TRACK_MOCK: AthleteTrack = {
  slug: TRACK_SLUG_MOCK,
  source: TrackSource.Coros,
  activityId: '479170300641050727',
  dateIso: '2026-07-26',
  distanceM: 5042.93,
  totalTimeS: 1400,
  gpxGzip: new Uint8Array([31, 139, 8, 0]),
  savedAtIso: TRACK_SAVED_AT_ISO_MOCK,
};

export const SECOND_TRACK_MOCK: AthleteTrack = {
  ...TRACK_MOCK,
  slug: '2026-07-19',
  activityId: '479170300641050700',
  dateIso: '2026-07-19',
};

export const TRACK_CHECK_MOCK: TrackDayCheck = {
  dateIso: '2026-07-12',
  source: TrackSource.Coros,
  checkedAtIso: TRACK_SAVED_AT_ISO_MOCK,
  attempts: 1,
};

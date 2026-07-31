import { CorosActivity } from '../core/coros/coros-api.interface';
import { RaceDay } from './track-sync.interface';

export const SYNC_RACE_MOCK: RaceDay = { slug: '2026-07-26', dateIso: '2026-07-26' };

/** A race whose track the watch never recorded — the day that gets journalled instead. */
export const TRACKLESS_RACE_MOCK: RaceDay = { slug: '2026-07-19', dateIso: '2026-07-19' };

/** A race that has not happened yet: never worth asking about. */
export const FUTURE_RACE_MOCK: RaceDay = { slug: '2027-01-03', dateIso: '2027-01-03' };

export const SYNC_GPX_MOCK = '<?xml version="1.0"?><gpx><trk><trkseg /></trk></gpx>';

export const SYNC_ACTIVITY_MOCK: CorosActivity = {
  labelId: '479170300641050727',
  dateIso: '2026-07-26',
  distanceM: 5042.93,
  totalTimeS: 1400,
  sportType: 100,
  name: 'Taganrog Run',
};

/** The warm-up of the same morning: right day, far too short to be the race. */
export const SYNC_WARMUP_ACTIVITY_MOCK: CorosActivity = {
  ...SYNC_ACTIVITY_MOCK,
  labelId: '479170300641050728',
  distanceM: 1117.74,
  totalTimeS: 486,
};

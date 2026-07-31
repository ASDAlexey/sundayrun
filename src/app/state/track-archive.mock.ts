import { gzipSync, strToU8, zipSync } from 'fflate';

import { TRACK_EXPORT_MANIFEST_NAME } from '../features/athlete/watch-sync/watch-sync.constant';
import { AthleteTrack } from './athlete-track.interface';
import { TrackSource } from './track-source.enum';

export const ARCHIVE_GPX_MOCK = '<?xml version="1.0"?><gpx><trk><trkseg /></trk></gpx>';

export const ARCHIVED_TRACK_MOCK: AthleteTrack = {
  slug: '2026-07-26',
  source: TrackSource.Coros,
  activityId: '479170300641050727',
  dateIso: '2026-07-26',
  distanceM: 5042.93,
  totalTimeS: 1400,
  gpxGzip: gzipSync(strToU8(ARCHIVE_GPX_MOCK)),
  savedAtIso: '2026-07-27T19:33:00.000Z',
};

/** An archive whose manifest is not valid JSON at all — a hand-edited or truncated file. */
export const BROKEN_MANIFEST_ARCHIVE_MOCK = zipSync({ [TRACK_EXPORT_MANIFEST_NAME]: strToU8('{not json') });

/** A manifest that parses but is not a list of entries. */
export const NON_LIST_MANIFEST_ARCHIVE_MOCK = zipSync({ [TRACK_EXPORT_MANIFEST_NAME]: strToU8('{"tracks":[]}') });

/** A manifest listing a track whose GPX never made it into the archive, plus one unusable row. */
export const INCOMPLETE_ARCHIVE_MOCK = zipSync({
  [TRACK_EXPORT_MANIFEST_NAME]: strToU8(
    JSON.stringify([
      { slug: '2026-07-19', file: '2026-07-19.gpx' },
      { slug: '' },
      { slug: '2026-07-12', file: '' },
      { file: 'orphan.gpx' },
      'nonsense',
    ]),
  ),
});

/** An archive with no manifest beside the file. */
export const MANIFESTLESS_ARCHIVE_MOCK = zipSync({ '2026-07-26.gpx': strToU8(ARCHIVE_GPX_MOCK) });

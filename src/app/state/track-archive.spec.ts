import { gunzipSync, strFromU8, unzipSync } from 'fflate';

import { TRACK_EXPORT_MANIFEST_NAME } from '../features/athlete/watch-sync/watch-sync.constant';
import { buildTrackArchive, readTrackArchive } from './track-archive';
import {
  ARCHIVE_GPX_MOCK,
  ARCHIVED_TRACK_MOCK,
  BROKEN_MANIFEST_ARCHIVE_MOCK,
  INCOMPLETE_ARCHIVE_MOCK,
  MANIFESTLESS_ARCHIVE_MOCK,
  NON_LIST_MANIFEST_ARCHIVE_MOCK,
} from './track-archive.mock';

describe('track archive', () => {
  it('packs tracks as plain GPX beside a manifest, and reads them back unchanged', () => {
    const archive = buildTrackArchive([ARCHIVED_TRACK_MOCK]);
    const files = unzipSync(archive);

    expect(strFromU8(files['2026-07-26.gpx'])).toBe(ARCHIVE_GPX_MOCK);
    expect(strFromU8(files[TRACK_EXPORT_MANIFEST_NAME])).toContain('"slug": "2026-07-26"');

    const [restored] = readTrackArchive(archive);

    expect({ ...restored, gpxGzip: strFromU8(gunzipSync(restored.gpxGzip)) }).toEqual({
      ...ARCHIVED_TRACK_MOCK,
      gpxGzip: ARCHIVE_GPX_MOCK,
      file: '2026-07-26.gpx',
    });
  });

  it('imports nothing from an archive it cannot make sense of', () => {
    expect(readTrackArchive(BROKEN_MANIFEST_ARCHIVE_MOCK)).toEqual([]);
    expect(readTrackArchive(NON_LIST_MANIFEST_ARCHIVE_MOCK)).toEqual([]);
    expect(readTrackArchive(MANIFESTLESS_ARCHIVE_MOCK)).toEqual([]);
    expect(readTrackArchive(INCOMPLETE_ARCHIVE_MOCK)).toEqual([]);
  });
});

import { gunzipSync, gzipSync, strFromU8, strToU8, unzipSync, Unzipped, zipSync, Zippable } from 'fflate';

import { TRACK_EXPORT_MANIFEST_NAME } from '../features/athlete/watch-sync/watch-sync.constant';
import { TrackManifestEntry } from '../features/athlete/watch-sync/watch-sync.interface';
import { AthleteTrack } from './athlete-track.interface';

/**
 * The «выгрузить всё» archive.
 *
 * Tracks live on one device and nowhere else, so without a way to carry them off a new laptop
 * means starting from nothing. A plain zip of GPX files plus a manifest — readable by any athlete
 * with any other tool, not a private format that only this site understands.
 */
export function buildTrackArchive(tracks: AthleteTrack[]): Uint8Array {
  const manifest: TrackManifestEntry[] = tracks.map((track) => ({
    slug: track.slug,
    source: track.source,
    activityId: track.activityId,
    dateIso: track.dateIso,
    distanceM: track.distanceM,
    totalTimeS: track.totalTimeS,
    savedAtIso: track.savedAtIso,
    file: `${track.slug}.gpx`,
  }));
  const files: Zippable = { [TRACK_EXPORT_MANIFEST_NAME]: strToU8(JSON.stringify(manifest, null, 2)) };

  for (const track of tracks) {
    files[`${track.slug}.gpx`] = gunzipSync(track.gpxGzip);
  }

  return zipSync(files);
}

/** Reads an archive back. Entries whose GPX is missing are skipped rather than stored empty. */
export function readTrackArchive(archive: Uint8Array): AthleteTrack[] {
  const files = unzipSync(archive);
  const manifest = manifestOf(files);

  return manifest.reduce<AthleteTrack[]>((tracks, entry) => {
    const gpx = files[entry.file];

    return gpx === undefined ? tracks : [...tracks, { ...entry, gpxGzip: gzipSync(gpx) }];
  }, []);
}

function manifestOf(files: Unzipped): TrackManifestEntry[] {
  const raw = files[TRACK_EXPORT_MANIFEST_NAME];

  if (raw === undefined) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(strFromU8(raw));

    return Array.isArray(parsed) ? parsed.filter(isManifestEntry) : [];
  } catch {
    // A hand-edited or truncated manifest reads as «nothing to import», not as a crash.
    return [];
  }
}

function isManifestEntry(value: unknown): value is TrackManifestEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const slug = 'slug' in value ? value.slug : undefined;
  const file = 'file' in value ? value.file : undefined;

  return typeof slug === 'string' && slug !== '' && typeof file === 'string' && file !== '';
}

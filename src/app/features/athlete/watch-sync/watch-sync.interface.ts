import { CorosRegionType } from '../../../core/coros/coros-region.enum';
import { TrackSourceType } from '../../../state/track-source.enum';

/** One entry of the region select on the link form. */
export interface WatchRegionOption {
  value: CorosRegionType;
  label: string;
}

/** A track's row inside the export manifest — everything about it except the GPX itself. */
export interface TrackManifestEntry {
  slug: string;
  source: TrackSourceType;
  activityId: string;
  dateIso: string;
  distanceM: number;
  totalTimeS: number;
  savedAtIso: string;
  /** Name of the GPX file carrying this track inside the archive. */
  file: string;
}

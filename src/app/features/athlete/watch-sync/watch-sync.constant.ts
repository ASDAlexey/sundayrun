import { CorosRegion } from '../../../core/coros/coros-region.enum';
import { WatchRegionOption } from './watch-sync.interface';

/** Which Coros silo the account lives in — the login host has to match, and only the owner knows. */
export const WATCH_REGION_OPTIONS: WatchRegionOption[] = [
  { value: CorosRegion.Eu, label: 'Европа (trainingeu.coros.com)' },
  { value: CorosRegion.Global, label: 'Глобальный (training.coros.com)' },
  { value: CorosRegion.Cn, label: 'Китай (trainingcn.coros.com)' },
];

/** Name of the archive «Выгрузить всё» produces. */
export const TRACK_EXPORT_FILE_NAME = 'sundayrun-tracks.zip';

/** What the archive carries beside the GPX files, so an import knows what it is looking at. */
export const TRACK_EXPORT_MANIFEST_NAME = 'manifest.json';

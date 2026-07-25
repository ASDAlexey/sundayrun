import { GenderType } from '../core/models/gender.enum';
import { AthleteRecord } from '../core/models/athlete-history.interface';
import { LapStats } from '../core/timer/lap-stats.interface';

/**
 * One directory entry as the offline cache stores it. The full `AthleteRecord` carries every run of
 * every athlete — tens of megabytes that localStorage would refuse — and the roster sheet needs none
 * of it: a name to search, a name to show, and the gender that saves the organiser a question.
 */
export interface CachedAthleteEntry {
  key: string;
  displayName: string;
  gender: GenderType | null;
}

/**
 * The directory as the service holds it: records for the search plus the whole archive read of the
 * first laps — the tile order, the two marks of the live «Круг» table and the regularity count. All
 * of it survives a reload without network, which is the only state the park ever sees.
 */
export interface TimerRosterCache extends LapStats {
  records: AthleteRecord[];
  /** When the cache was written; null while the device has never read the directory. */
  savedAtMs: number | null;
}

import { GenderType } from './gender.enum';

/** One run of an athlete; `dateIso` is 'YYYY-MM-DD', `timeMs` is integer milliseconds. */
export interface AthleteRun {
  dateIso: string;
  slug: string;
  timeMs: number;
  distanceKm: number;
}

/**
 * Aggregated athlete history; `bestMs` and `bestMsByYear` are computed over 5 km runs only.
 * `participationSlugs` lists every event the athlete appeared in — including DNF-only events
 * that never become runs — so removing an event can fully revert its contribution.
 */
export interface AthleteRecord {
  key: string;
  displayName: string;
  gender: GenderType | null;
  participationSlugs: string[];
  runs: AthleteRun[];
  bestMs: number | null;
  bestMsByYear: Record<string, number>;
}

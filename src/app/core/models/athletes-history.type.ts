import { AthleteRecord } from './athlete-history.interface';

/** All known athletes keyed by `AthleteRecord.key`. */
export type AthletesHistory = Record<string, AthleteRecord>;

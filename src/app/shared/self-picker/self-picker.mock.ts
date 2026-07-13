import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { SelfAthlete } from '../../state/self-athlete.interface';

const record = (key: string, displayName: string): AthleteRecord => ({
  key,
  displayName,
  gender: null,
  participationSlugs: [],
  runs: [],
  bestMs: null,
  bestMsByYear: {},
});

export const PICKER_DIRECTORY: AthleteRecord[] = [record('петров петр', 'Петров Пётр'), record('иванова мария', 'Иванова Мария')];

/** Normalizes to `иванова` and matches exactly one directory entry. */
export const PICKER_QUERY = ' ИВАНОВА ';

export const PICKER_MATCH = PICKER_DIRECTORY[1];

export const EXPECTED_PICKER_SAVE: SelfAthlete = { key: 'иванова мария', displayName: 'Иванова Мария' };

export const PICKED_SELF: SelfAthlete = { key: 'петров петр', displayName: 'Петров Пётр' };

export const PICKER_LOAD_ERROR_MESSAGE = 'directory load failed';

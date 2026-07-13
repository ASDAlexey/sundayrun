import { AthleteRecord } from '../models/athlete-history.interface';

const record = (key: string, displayName: string): AthleteRecord => ({
  key,
  displayName,
  gender: null,
  participationSlugs: [],
  runs: [],
  bestMs: null,
  bestMsByYear: {},
});

const PETRENKO = record('петренко ольга', 'Петренко Ольга');

const PETROV = record('петров петр', 'Петров Пётр');

const PETROVA = record('петрова мария', 'Петрова Мария');

const SIDOROVA = record('сидорова анна', 'Сидорова Анна');

/** Deliberately unsorted: the suggester must order by display name itself. */
export const SUGGEST_OPTIONS: AthleteRecord[] = [SIDOROVA, PETROVA, PETROV, PETRENKO];

/** Normalizes to `петр` (ё → е, trimmed, lowercased) and matches the three namesakes. */
export const SUGGEST_QUERY = ' ПЁТР ';

export const SUGGEST_EXCLUDED_KEY = 'петров петр';

/** All namesakes, alphabetical by display name. */
export const EXPECTED_SUGGESTED: AthleteRecord[] = [PETRENKO, PETROV, PETROVA];

export const EXPECTED_SUGGESTED_WITHOUT_EXCLUDED: AthleteRecord[] = [PETRENKO, PETROVA];

export const EXPECTED_SUGGESTED_LIMITED: AthleteRecord[] = [PETRENKO, PETROV];

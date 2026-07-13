import { SelfAthlete } from './self-athlete.interface';

export const STORED_SELF_ATHLETE: SelfAthlete = { key: 'иванова мария', displayName: 'Иванова Мария' };

export const STORED_SELF_ATHLETE_JSON = JSON.stringify(STORED_SELF_ATHLETE);

export const SAVED_SELF_ATHLETE: SelfAthlete = { key: 'петров петр', displayName: 'Петров Пётр' };

export const MALFORMED_SELF_ATHLETE_JSON = '{not json';

/** Valid JSON of the wrong shape: an empty key must not count as a pick. */
export const WRONG_SHAPE_SELF_ATHLETE_JSON = JSON.stringify({ key: '', displayName: 'Иванова Мария' });

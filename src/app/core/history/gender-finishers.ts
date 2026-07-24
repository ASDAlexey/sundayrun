import { Gender, GenderType } from '../models/gender.enum';
import { EventGenderFinishers } from './gender-finishers.interface';

/**
 * The event's finisher count in the athlete's own gender — the denominator of the «3/22» place cell.
 * A genderless athlete or a missing tally leaves it undefined, so the caller falls back to a bare place.
 */
export function genderFinisherCount(finishers: EventGenderFinishers | undefined, gender: GenderType | null): number | undefined {
  if (finishers === undefined || gender === null) {
    return undefined;
  }

  return gender === Gender.male ? finishers.male : finishers.female;
}

import { type AthletesHistory } from '../models/athletes-history.type';
import { Gender, type GenderType } from '../models/gender.enum';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { isoYear } from './iso-year';
import { buildAutoNote } from './notes-builder';
import { type AutoNoteInput } from './notes-builder.interface';

/** The state an event's notes are written against: the history before it, and its own date. */
export interface AutoNoteEventContext {
  readonly history: AthletesHistory;
  readonly dateIso: string;
}

/**
 * Builds the auto notes for a whole event, positionally matching `inputs`. The year best is
 * tracked per gender and folded in result-by-result in ascending time order, so only the day's
 * fastest finisher to beat it gets the year-best note — exactly how the historical protocols
 * mark it. `history` must already be cut to the events strictly before `dateIso`
 * (see `historyBeforeDate`), so the results never compete against themselves.
 */
export function buildEventAutoNotes(inputs: AutoNoteInput[], event: AutoNoteEventContext): string[] {
  const { history, dateIso } = event;
  const yearBests = courseYearBests(history, isoYear(dateIso));
  const notes: string[] = new Array<string>(inputs.length);

  for (const index of byAscendingTime(inputs)) {
    const input = inputs[index];

    notes[index] = buildAutoNote(input, { history, courseYearBestMs: input.gender === null ? null : yearBests[input.gender] });

    if (input.gender !== null && input.timeMs !== null && input.distanceKm === FIVE_KM_DISTANCE_KM) {
      const currentBestMs = yearBests[input.gender];

      if (currentBestMs === null || input.timeMs < currentBestMs) {
        yearBests[input.gender] = input.timeMs;
      }
    }
  }

  return notes;
}

/** Input indices in finishing order: ascending time, DNF last, stable for ties. */
function byAscendingTime(inputs: AutoNoteInput[]): number[] {
  return inputs
    .map((input, index) => index)
    .sort((left, right) => (inputs[left].timeMs ?? Number.POSITIVE_INFINITY) - (inputs[right].timeMs ?? Number.POSITIVE_INFINITY));
}

/** The year's best 5 km time among all athletes of each gender, taken from the rolled-up `bestMsByYear`. */
function courseYearBests(history: AthletesHistory, year: string): Record<GenderType, number | null> {
  const bests: Record<GenderType, number | null> = { [Gender.male]: null, [Gender.female]: null };

  for (const record of Object.values(history)) {
    const yearBestMs: number | undefined = record.bestMsByYear[year];

    if (record.gender === null || yearBestMs === undefined) {
      continue;
    }

    const currentBestMs = bests[record.gender];

    if (currentBestMs === null || yearBestMs < currentBestMs) {
      bests[record.gender] = yearBestMs;
    }
  }

  return bests;
}

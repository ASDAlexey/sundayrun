import { Participant } from '../models/participant.interface';
import { FIVE_KM_LAP_COUNT } from '../protocol/protocol-builder.constant';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { normalizeAthleteKey } from './athlete-key';
import { AutoNoteInput } from './notes-builder.interface';

/**
 * Maps a participant to the `buildAutoNote` input: 2 recorded laps mean the full 5 km,
 * anything less is the short 2.3 km. A DNF (`totalMs` null) keeps its lap-based distance —
 * `buildAutoNote` ignores the distance of a result without a time.
 */
export function toAutoNoteInput(participant: Participant, dateIso: string): AutoNoteInput {
  return {
    key: normalizeAthleteKey(participant.fullName),
    timeMs: participant.totalMs,
    distanceKm: participant.lapsMs.length >= FIVE_KM_LAP_COUNT ? FIVE_KM_DISTANCE_KM : TWO_THREE_KM_DISTANCE_KM,
    dateIso,
  };
}

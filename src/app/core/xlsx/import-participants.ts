import { inferGender } from '../gender/gender-inference';
import { Participant } from '../models/participant.interface';
import { parseTimerExport } from './timer-export-parser';
import { readXlsxRows } from './xlsx-reader';

/**
 * Reads a timer xlsx export into participants and infers gender for each one
 * from the full name; manual fields (note, club) stay as the parser set them.
 */
export function importParticipants(bytes: Uint8Array): Participant[] {
  return parseTimerExport(readXlsxRows(bytes)).map((participant) => {
    const inference = inferGender(participant.fullName);

    return {
      ...participant,
      gender: inference.gender,
      genderConfidence: inference.confidence,
      genderSource: inference.source,
    };
  });
}

import { Participant } from '../core/models/participant.interface';
import { RaceEvent } from '../core/models/race-event.interface';
import { SourceFile } from './source-file.interface';

/**
 * One imported workbook of a (possibly multi-file) upload: its participants, the race requisites
 * once known, and whether the auto notes already ran — they run once per draft, so later manual
 * note fixes survive draft switching.
 */
export interface ProtocolDraft {
  participants: Participant[];
  event: RaceEvent | null;
  sourceFile: SourceFile;
  suggestedDateIso: string | null;
  notesApplied: boolean;
}

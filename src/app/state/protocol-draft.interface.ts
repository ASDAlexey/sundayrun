import { Participant } from '../core/models/participant.interface';
import { RaceEvent } from '../core/models/race-event.interface';
import { SourceFile } from './source-file.interface';

/**
 * One protocol of a (possibly multi-file) upload: its participants, the race requisites once
 * known, and whether the auto notes already ran — they run once per draft, so later manual note
 * fixes survive draft switching. `sourceFile` is null for a race timed by the built-in stopwatch:
 * there is no workbook behind it, the session itself is the source (docs/TIMER.md §3).
 */
export interface ProtocolDraft {
  participants: Participant[];
  event: RaceEvent | null;
  sourceFile: SourceFile | null;
  suggestedDateIso: string | null;
  notesApplied: boolean;
}

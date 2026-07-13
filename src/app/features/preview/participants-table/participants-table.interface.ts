import { Participant } from '../../../core/models/participant.interface';

/** Precomputed presentation of one table row, so the template stays free of function calls. */
export interface ParticipantRowView {
  participant: Participant;
  timeText: string;
  lap1Text: string;
  lap2Text: string;
  distanceText: string;
  unverified: boolean;
  isMale: boolean;
  isFemale: boolean;
  /** The auto-generated note exactly as the protocol will print it; an em dash when empty. */
  noteText: string;
}

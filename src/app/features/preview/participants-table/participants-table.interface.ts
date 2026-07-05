import { Participant } from '../../../core/models/participant.interface';

/** Precomputed presentation of one table row, so the template stays free of function calls. */
export interface ParticipantRowView {
  participant: Participant;
  timeText: string;
  distanceText: string;
  unverified: boolean;
  isMale: boolean;
  isFemale: boolean;
  noteAriaLabel: string;
}

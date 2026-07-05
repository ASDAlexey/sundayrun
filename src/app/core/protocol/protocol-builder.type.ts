import { Participant } from '../models/participant.interface';

/** A participant with a recorded total time (not DNF). */
export type TimedParticipant = Participant & { totalMs: number };

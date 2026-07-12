import { Gender } from '../models/gender.enum';
import { Participant } from '../models/participant.interface';
import { PROTOCOL_PARTICIPANTS } from '../protocol/protocol-builder.mock';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from './distance.constant';
import { AutoNoteInput } from './notes-builder.interface';

export const NOTE_INPUT_DATE_ISO = '2026-06-14';

/** [participant, expected input]: a 5 km finisher, a 2.3 km one-lap runner and a lap-less DNF. */
export const AUTO_NOTE_INPUT_CASES: readonly (readonly [Participant, AutoNoteInput])[] = [
  [
    PROTOCOL_PARTICIPANTS[0],
    { key: 'иванов иван', gender: Gender.male, timeMs: 1398000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: NOTE_INPUT_DATE_ISO },
  ],
  [
    PROTOCOL_PARTICIPANTS[6],
    { key: 'быстрова яна', gender: Gender.female, timeMs: 600000, distanceKm: TWO_THREE_KM_DISTANCE_KM, dateIso: NOTE_INPUT_DATE_ISO },
  ],
  [
    PROTOCOL_PARTICIPANTS[8],
    { key: 'сошедшая вторая', gender: Gender.female, timeMs: null, distanceKm: TWO_THREE_KM_DISTANCE_KM, dateIso: NOTE_INPUT_DATE_ISO },
  ],
];

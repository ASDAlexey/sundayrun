import { ProtocolRow } from '../models/protocol-row.interface';
import { RaceEvent } from '../models/race-event.interface';
import { EMPTY_TIME } from '../protocol/protocol-builder.constant';
import { formatRussianDateShort } from '../time/russian-date';
import {
  ANNOUNCEMENT_TITLE_PREFIX,
  DATE_SEPARATOR,
  FEMALE_WINNER_PREFIX,
  FIRST_PLACE,
  LINE_SEPARATOR,
  LOCATION_SEPARATOR,
  MALE_WINNER_PREFIX,
  PARTICIPANTS_PREFIX,
  WINNER_SEPARATOR,
  WINNER_TIME_CLOSE,
  WINNER_TIME_OPEN,
  WINNERS_PREFIX,
} from './race-announcement.constant';

/**
 * Multi-line VK post description: event title with the short date, location,
 * the count of participants with any recorded time and the winners per gender
 * (the winners line is omitted when nobody took first place).
 */
export function composeRaceAnnouncement(event: RaceEvent, rows: ProtocolRow[]): string {
  const lines = [
    `${ANNOUNCEMENT_TITLE_PREFIX}${event.number}${DATE_SEPARATOR}${formatRussianDateShort(event.dateIso)}`,
    `${event.park}${LOCATION_SEPARATOR}${event.city}`,
    `${PARTICIPANTS_PREFIX}${countTimedParticipants(rows)}`,
  ];
  const winnersLine = composeWinnersLine(rows);

  if (winnersLine !== null) {
    lines.push(winnersLine);
  }

  return lines.join(LINE_SEPARATOR);
}

/** Participants with any recorded time (DNF rows are excluded). */
function countTimedParticipants(rows: ProtocolRow[]): number {
  return rows.filter((row) => row.time23 !== EMPTY_TIME || row.time5 !== EMPTY_TIME).length;
}

function composeWinnersLine(rows: ProtocolRow[]): string | null {
  const maleWinner = rows.find((row) => row.placeM === FIRST_PLACE);
  const femaleWinner = rows.find((row) => row.placeF === FIRST_PLACE);
  const parts: string[] = [];

  if (maleWinner !== undefined) {
    parts.push(`${MALE_WINNER_PREFIX}${winnerResult(maleWinner)}`);
  }

  if (femaleWinner !== undefined) {
    parts.push(`${FEMALE_WINNER_PREFIX}${winnerResult(femaleWinner)}`);
  }

  return parts.length === 0 ? null : `${WINNERS_PREFIX}${parts.join(WINNER_SEPARATOR)}`;
}

function winnerResult(row: ProtocolRow): string {
  return `${row.fullName}${WINNER_TIME_OPEN}${row.time5}${WINNER_TIME_CLOSE}`;
}

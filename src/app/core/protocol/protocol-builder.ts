import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from '../history/distance.constant';
import { Gender, GenderType } from '../models/gender.enum';
import { Participant } from '../models/participant.interface';
import { ProtocolRow } from '../models/protocol-row.interface';
import { formatDuration } from '../time/duration';
import { EMPTY_TIME, FIRST_LAP_INDEX, FIRST_ROW_INDEX, FIVE_KM_LAP_COUNT, TWO_THREE_KM_LAP_COUNT } from './protocol-builder.constant';
import { TimedParticipant } from './protocol-builder.type';

/**
 * Builds display-ready protocol rows:
 * 5 km finishers by total time ascending (places 1..N per gender, stable ties, genders interleaved),
 * then 2.3 km-only runners by total time ascending (no places),
 * then DNF in input order (empty times, no places).
 */
export function buildProtocolRows(participants: Participant[]): ProtocolRow[] {
  const finishers = sortByTotalMs(participants.filter(isFiveKmFinisher));
  const shortRunners = sortByTotalMs(participants.filter(isTwoThreeKmRunner));
  const didNotFinish = participants.filter((participant) => participant.totalMs === null);
  const places: Record<GenderType, number> = { [Gender.male]: 0, [Gender.female]: 0 };
  const rows: ProtocolRow[] = [];

  for (const participant of finishers) {
    rows.push(toFiveKmRow(participant, rows.length + FIRST_ROW_INDEX, places));
  }

  for (const participant of shortRunners) {
    rows.push(toTwoThreeKmRow(participant, rows.length + FIRST_ROW_INDEX));
  }

  for (const participant of didNotFinish) {
    rows.push(toDnfRow(participant, rows.length + FIRST_ROW_INDEX));
  }

  return rows;
}

function isFiveKmFinisher(participant: Participant): participant is TimedParticipant {
  return participant.totalMs !== null && participant.lapsMs.length === FIVE_KM_LAP_COUNT;
}

function isTwoThreeKmRunner(participant: Participant): participant is TimedParticipant {
  return participant.totalMs !== null && participant.lapsMs.length === TWO_THREE_KM_LAP_COUNT;
}

/** Stable ascending sort by total time (equal times keep input order). */
function sortByTotalMs(participants: TimedParticipant[]): TimedParticipant[] {
  return [...participants].sort((left, right) => left.totalMs - right.totalMs);
}

function toFiveKmRow(participant: TimedParticipant, index: number, places: Record<GenderType, number>): ProtocolRow {
  const gender = participant.gender;
  const place = gender === null ? null : (places[gender] += 1);
  const firstLapMs = participant.lapsMs[FIRST_LAP_INDEX];

  return {
    index,
    fullName: participant.fullName,
    time23: firstLapMs === null ? EMPTY_TIME : formatDuration(firstLapMs),
    time5: formatDuration(participant.totalMs),
    totalMs: participant.totalMs,
    distanceKm: FIVE_KM_DISTANCE_KM,
    gender,
    placeM: gender === Gender.male ? place : null,
    placeF: gender === Gender.female ? place : null,
    club: participant.club,
    note: participant.note,
  };
}

function toTwoThreeKmRow(participant: TimedParticipant, index: number): ProtocolRow {
  return {
    index,
    fullName: participant.fullName,
    time23: formatDuration(participant.totalMs),
    time5: EMPTY_TIME,
    totalMs: participant.totalMs,
    distanceKm: TWO_THREE_KM_DISTANCE_KM,
    gender: participant.gender,
    placeM: null,
    placeF: null,
    club: participant.club,
    note: participant.note,
  };
}

function toDnfRow(participant: Participant, index: number): ProtocolRow {
  return {
    index,
    fullName: participant.fullName,
    time23: EMPTY_TIME,
    time5: EMPTY_TIME,
    totalMs: null,
    distanceKm: null,
    gender: participant.gender,
    placeM: null,
    placeF: null,
    club: participant.club,
    note: participant.note,
  };
}

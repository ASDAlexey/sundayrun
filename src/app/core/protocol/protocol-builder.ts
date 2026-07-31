import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from '../history/distance.constant';
import { Gender, GenderType } from '../models/gender.enum';
import { Participant } from '../models/participant.interface';
import { ProtocolRow } from '../models/protocol-row.interface';
import { formatRaceTime } from '../time/duration';
import { lapTimeText, lapsCarryHundredths } from './race-time-cells';
import { EMPTY_TIME, FIRST_LAP_INDEX, FIRST_ROW_INDEX, FIVE_KM_LAP_COUNT, TWO_THREE_KM_LAP_COUNT } from './protocol-builder.constant';
import { TimedParticipant } from './protocol-builder.type';

/**
 * Builds display-ready protocol rows:
 * 5 km finishers by total time ascending (places 1..N per gender, stable ties, genders interleaved),
 * then 2.3 km-only runners by total time ascending (no places),
 * then DNF in input order (empty times, no places).
 */
export function buildProtocolRows(participants: Participant[]): ProtocolRow[] {
  const places: Record<GenderType, number> = { [Gender.male]: 0, [Gender.female]: 0 };
  const ordered = orderProtocolParticipants(participants);
  // Decided once for the whole protocol — a stopwatch session times every lap to the millisecond,
  // an imported sheet none of them, and the 2.3 km column follows the event it belongs to.
  const lapHundredths = lapsCarryHundredths(ordered.map(lapReadingOf));

  return ordered.map((participant, index) => {
    if (isFiveKmFinisher(participant)) {
      return toFiveKmRow(participant, index + FIRST_ROW_INDEX, places, lapHundredths);
    }

    if (isTwoThreeKmRunner(participant)) {
      return toTwoThreeKmRow(participant, index + FIRST_ROW_INDEX, lapHundredths);
    }

    return toDnfRow(participant, index + FIRST_ROW_INDEX);
  });
}

/** What each participant contributes to the 2.3 km column: their split, or their whole one-lap race. */
function lapReadingOf(participant: Participant): number | null {
  if (isFiveKmFinisher(participant)) {
    return participant.lapsMs[FIRST_LAP_INDEX];
  }

  return isTwoThreeKmRunner(participant) ? participant.totalMs : null;
}

/**
 * The exact participant order behind `buildProtocolRows`, exported so an editing view can map
 * each built row back to its source participant by index.
 */
export function orderProtocolParticipants(participants: Participant[]): Participant[] {
  return [
    ...sortByTotalMs(participants.filter(isFiveKmFinisher)),
    ...sortByTotalMs(participants.filter(isTwoThreeKmRunner)),
    ...participants.filter((participant) => participant.totalMs === null),
  ];
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

function toFiveKmRow(
  participant: TimedParticipant,
  index: number,
  places: Record<GenderType, number>,
  lapHundredths: boolean,
): ProtocolRow {
  const gender = participant.gender;
  const place = gender === null ? null : (places[gender] += 1);
  const firstLapMs = participant.lapsMs[FIRST_LAP_INDEX];

  return {
    index,
    fullName: participant.fullName,
    time23: firstLapMs === null ? EMPTY_TIME : lapTimeText(firstLapMs, lapHundredths),
    time5: formatRaceTime(participant.totalMs),
    totalMs: participant.totalMs,
    distanceKm: FIVE_KM_DISTANCE_KM,
    gender,
    placeM: gender === Gender.male ? place : null,
    placeF: gender === Gender.female ? place : null,
    club: participant.club,
    note: participant.note,
  };
}

function toTwoThreeKmRow(participant: TimedParticipant, index: number, lapHundredths: boolean): ProtocolRow {
  return {
    index,
    fullName: participant.fullName,
    time23: lapTimeText(participant.totalMs, lapHundredths),
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

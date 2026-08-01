import { ProtocolRow } from '../models/protocol-row.interface';
import { buildProtocolRows } from '../protocol/protocol-builder';
import {
  SHARE_EMPTY_GROUP,
  SHARE_FIRST_PLACE,
  SHARE_FIVE_KM,
  SHARE_GROUP_SEPARATOR,
  SHARE_LINE_SEPARATOR,
  SHARE_NAME_TIME_SEPARATOR,
  SHARE_PLACE_SUFFIX,
} from './session-share-text.constant';
import { SessionShareTextInput, SessionShareTextLabels } from './session-share-text.interface';
import { sessionToParticipants } from './session-to-participants';

/**
 * The measurement as a message — the finish order in plain text, ready to be pasted into a chat
 * (docs/TIMER.md §8). Telegram and MAX are reached through a share url, and a share url carries text
 * and a link and nothing else: the workbook goes to whoever needs the numbers, this goes to everybody
 * else, five minutes after the race and from the phone that timed it.
 *
 * The order is the protocol's own, so the message and the published page can never disagree: five
 * kilometre finishers by time with their gender places, then the one-lap runners, then whoever did
 * not finish. Groups that are empty print nothing — a heading over blank space reads as data lost.
 *
 * Pure, and the words arrive as an argument: the core has no `$localize` and the same builder serves
 * both locales.
 */
export function buildSessionShareText(input: SessionShareTextInput, labels: SessionShareTextLabels): string {
  const rows = buildProtocolRows(sessionToParticipants(input.session));
  const groups = [
    groupText(labels.fiveKm, rows.filter(isFiveKm), placedLine),
    groupText(labels.twoThreeKm, rows.filter(isTwoThreeKm), lapLine),
    groupText(labels.didNotFinish, rows.filter(isUnfinished), nameLine),
  ];

  return [labels.title, ...groups, input.url].filter(isPresent).join(SHARE_GROUP_SEPARATOR);
}

/** A heading with its lines under it, or nothing at all when the group has nobody in it. */
function groupText(heading: string, rows: readonly ProtocolRow[], lineOf: (row: ProtocolRow, index: number) => string): string | null {
  if (rows.length === SHARE_EMPTY_GROUP) {
    return null;
  }

  return [heading, ...rows.map((row, index) => lineOf(row, index))].join(SHARE_LINE_SEPARATOR);
}

/** «1. Троилин Антон — 19:03,03». The place is the position in the group, not the protocol index. */
function placedLine(row: ProtocolRow, index: number): string {
  return `${index + SHARE_FIRST_PLACE}${SHARE_PLACE_SUFFIX}${row.fullName}${SHARE_NAME_TIME_SEPARATOR}${row.time5}`;
}

/** The 2.3 km group is not a race and gets no places — a lap is a distance covered, not a result. */
function lapLine(row: ProtocolRow): string {
  return `${row.fullName}${SHARE_NAME_TIME_SEPARATOR}${row.time23}`;
}

function nameLine(row: ProtocolRow): string {
  return row.fullName;
}

function isFiveKm(row: ProtocolRow): boolean {
  return row.distanceKm === SHARE_FIVE_KM;
}

function isTwoThreeKm(row: ProtocolRow): boolean {
  return row.distanceKm !== null && row.distanceKm !== SHARE_FIVE_KM;
}

function isUnfinished(row: ProtocolRow): boolean {
  return row.distanceKm === null;
}

function isPresent(part: string | null): part is string {
  return part !== null;
}

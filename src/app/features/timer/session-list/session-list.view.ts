import { formatRussianDateLong } from '../../../core/time/russian-date';
import { unassignedSplits } from '../../../core/timer/session-splits';
import { TimerSession } from '../../../core/timer/timer-session.interface';
import { META_SEPARATOR, TIMER_EXPORT_FILE_EXTENSION, TIMER_EXPORT_FILE_PREFIX, TIMER_SESSIONS_NONE } from './session-list.constant';
import { TimerSessionRow } from './session-list.interface';
import { runnerCountText, splitCountText, unnamedCountText } from './session-list.text';

/** «Мои замеры» as rows, in the order the store keeps them (the newest measurement first). */
export function buildTimerSessionRows(sessions: readonly TimerSession[]): TimerSessionRow[] {
  return sessions.map((session) => buildTimerSessionRow(session));
}

/** The same line for a single measurement — the finish screen names the one it is about to delete. */
export function buildTimerSessionRow(session: TimerSession): TimerSessionRow {
  return {
    session,
    dateText: formatRussianDateLong(session.dateIso),
    metaText: buildMetaText(session),
    status: session.publish.state,
    fileName: `${TIMER_EXPORT_FILE_PREFIX}${session.dateIso}${TIMER_EXPORT_FILE_EXTENSION}`,
  };
}

/** The unnamed tail is only spelled out while it is there — a clean measurement says nothing about it. */
function buildMetaText(session: TimerSession): string {
  const parts = [runnerCountText(session.runners.length), splitCountText(session.splits.length)];
  const unnamed = unassignedSplits(session).length;

  if (unnamed > TIMER_SESSIONS_NONE) {
    parts.push(unnamedCountText(unnamed));
  }

  return parts.join(META_SEPARATOR);
}

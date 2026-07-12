import { AthleteRun } from '../models/athlete-history.interface';
import { filterRuns } from './athlete-runs';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { HeadToHead, HeadToHeadMeeting } from './head-to-head.interface';

/**
 * Scores the duel of two athletes: every event both finished on the full 5 km course becomes a
 * meeting, the faster finisher takes it, and equal times are a draw. One-lap runs never meet —
 * the course differs — so only 5 km runs enter. Sides mirror the argument order.
 */
export function buildHeadToHead(leftRuns: AthleteRun[], rightRuns: AthleteRun[]): HeadToHead {
  const rightBySlug = new Map(filterRuns(rightRuns, null, FIVE_KM_DISTANCE_KM).map((run) => [run.slug, run]));
  const meetings = filterRuns(leftRuns, null, FIVE_KM_DISTANCE_KM)
    .flatMap((run) => toMeetings(run, rightBySlug.get(run.slug)))
    .sort(compareByDateDescending);

  return {
    meetingCount: meetings.length,
    leftWins: meetings.filter((meeting) => meeting.leftMs < meeting.rightMs).length,
    rightWins: meetings.filter((meeting) => meeting.rightMs < meeting.leftMs).length,
    draws: meetings.filter((meeting) => meeting.leftMs === meeting.rightMs).length,
    meetings,
  };
}

function toMeetings(left: AthleteRun, right: AthleteRun | undefined): HeadToHeadMeeting[] {
  return right === undefined ? [] : [{ slug: left.slug, dateIso: left.dateIso, leftMs: left.timeMs, rightMs: right.timeMs }];
}

function compareByDateDescending(left: HeadToHeadMeeting, right: HeadToHeadMeeting): number {
  return right.dateIso.localeCompare(left.dateIso);
}

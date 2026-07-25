import { GenderConfidence, GenderSource } from '../models/gender.enum';
import { Participant } from '../models/participant.interface';
import { runnerSplitTimesMs } from './session-splits';
import { EMPTY_TEXT, FINISH_SPLIT_INDEX, FIRST_POSITION, LAP_SPLIT_INDEX, MAX_SPLITS_PER_RUNNER } from './timer-session.constant';
import { TimerRunnerOutcome } from './timer-session.enum';
import { TimerRunner, TimerSession } from './timer-session.interface';

/**
 * Turns a finished session into the protocol input `buildProtocolRows` already knows how to lay out
 * (docs/TIMER.md §3). Two taps make a 5 km finisher, one tap plus «сошёл после круга» a 2.3 km
 * runner, everything else a DNF — including a single tap left alone, which the plan settled on as
 * DNF rather than a guessed lap (§14). The organiser confirmed the gender while adding the person,
 * so it comes with the highest confidence; the note, the club and the name order are somebody
 * else's job — the roster sheet normalizes names, `/preview` fills the rest.
 */
export function sessionToParticipants(session: TimerSession): Participant[] {
  return session.runners.map((runner, index) => toParticipant(session, runner, index + FIRST_POSITION));
}

function toParticipant(session: TimerSession, runner: TimerRunner, id: number): Participant {
  const timesMs = runnerSplitTimesMs(session, runner.id);
  const lapMs = timesMs[LAP_SPLIT_INDEX];

  if (runner.outcome === TimerRunnerOutcome.dnf || timesMs.length === 0) {
    return buildParticipant(runner, id, null, []);
  }

  if (timesMs.length >= MAX_SPLITS_PER_RUNNER) {
    const finishMs = timesMs[FINISH_SPLIT_INDEX];

    return buildParticipant(runner, id, finishMs, [lapMs, finishMs - lapMs]);
  }

  return runner.outcome === TimerRunnerOutcome.lapOnly
    ? buildParticipant(runner, id, lapMs, [lapMs])
    : buildParticipant(runner, id, null, []);
}

function buildParticipant(runner: TimerRunner, id: number, totalMs: number | null, lapsMs: number[]): Participant {
  const known = runner.gender !== null;

  return {
    id,
    fullName: runner.fullName,
    totalMs,
    lapsMs,
    gender: runner.gender,
    genderConfidence: known ? GenderConfidence.high : GenderConfidence.unknown,
    genderSource: known ? GenderSource.manual : GenderSource.unknown,
    note: EMPTY_TEXT,
    club: EMPTY_TEXT,
  };
}

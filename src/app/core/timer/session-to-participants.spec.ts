import { buildProtocolRows } from '../protocol/protocol-builder';
import { sessionToParticipants } from './session-to-participants';
import { EXPECTED_TIMER_PARTICIPANTS, EXPECTED_UNTIMED_PARTICIPANTS } from './session-to-participants.mock';
import { TIMER_SESSION_FINISHED, TIMER_SESSION_WITHOUT_SPLITS } from './timer-session.mock';

describe('sessionToParticipants', () => {
  it('maps taps and outcomes onto protocol participants and hands the result to the protocol builder', () => {
    const participants = sessionToParticipants(TIMER_SESSION_FINISHED);

    expect(participants).toEqual(EXPECTED_TIMER_PARTICIPANTS);
    expect(sessionToParticipants(TIMER_SESSION_WITHOUT_SPLITS), 'a race nobody timed is all DNF').toEqual(EXPECTED_UNTIMED_PARTICIPANTS);
    expect(
      buildProtocolRows(participants).map((row) => row.fullName),
      'the built protocol keeps every runner',
    ).toHaveLength(EXPECTED_TIMER_PARTICIPANTS.length);
  });
});

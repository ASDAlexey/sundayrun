import { buildSessionShareText } from './session-share-text';
import { SHARE_EXPECTED_TEXT, SHARE_LABELS, SHARE_RACE_URL } from './session-share-text.mock';
import { TIMER_SESSION_FINISHED, TIMER_SESSION_WITHOUT_SPLITS } from './timer-session.mock';

describe('buildSessionShareText', () => {
  it('writes the protocol out as a chat message, links it only when there is a page, and skips empty groups', () => {
    expect(buildSessionShareText({ session: TIMER_SESSION_FINISHED, url: null }, SHARE_LABELS)).toBe(SHARE_EXPECTED_TEXT);
    expect(
      buildSessionShareText({ session: TIMER_SESSION_FINISHED, url: SHARE_RACE_URL }, SHARE_LABELS),
      'a published race carries its own address at the foot of the message',
    ).toBe(`${SHARE_EXPECTED_TEXT}\n\n${SHARE_RACE_URL}`);

    const untimed = buildSessionShareText({ session: TIMER_SESSION_WITHOUT_SPLITS, url: null }, SHARE_LABELS);

    expect(untimed, 'a race nobody timed is all DNF, and the two timed headings stay away').toBe(
      [SHARE_LABELS.title, '', SHARE_LABELS.didNotFinish, ...TIMER_SESSION_WITHOUT_SPLITS.runners.map((runner) => runner.fullName)].join(
        '\n',
      ),
    );
    expect(untimed).not.toContain(SHARE_LABELS.fiveKm);
  });
});

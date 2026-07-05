import { composeRaceAnnouncement } from './race-announcement';
import { ANNOUNCEMENT_CASES, ANNOUNCEMENT_EVENT_MOCK } from './race-announcement.mock';

describe('race-announcement', () => {
  it('composes the VK announcement with the timed participants count and per-gender winners', () => {
    for (const [label, rows, expected] of ANNOUNCEMENT_CASES) {
      expect(composeRaceAnnouncement(ANNOUNCEMENT_EVENT_MOCK, rows), label).toBe(expected);
    }
  });
});

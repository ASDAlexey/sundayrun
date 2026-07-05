import { eventFilePaths } from './event-paths';
import { EVENT_DATE_ISO, EXPECTED_EVENT_PATHS } from './event-paths.mock';

describe('eventFilePaths', () => {
  it('places all three files under events/<dateIso>/', () => {
    expect(eventFilePaths(EVENT_DATE_ISO)).toEqual(EXPECTED_EVENT_PATHS);
  });
});

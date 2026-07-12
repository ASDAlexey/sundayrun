import { eventDatesFromHistory } from './event-dates';
import { EVENT_DATES_HISTORY, EXPECTED_EVENT_DATES } from './event-dates.mock';

describe('eventDatesFromHistory', () => {
  it('recovers the published dates from the participations, deduplicated and sorted ascending', () => {
    expect(eventDatesFromHistory(EVENT_DATES_HISTORY)).toEqual(EXPECTED_EVENT_DATES);
    expect(eventDatesFromHistory({}), 'an empty history has no published dates').toEqual([]);
  });
});

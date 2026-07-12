import { monthFinalSlugs } from './month-finals';
import { EXPECTED_MONTH_FINALS, MONTH_FINAL_EVENT_SLUGS, MONTH_FINALS_TODAY } from './month-finals.mock';

describe('monthFinalSlugs', () => {
  it('marks the last race of every closed month and keeps the open month unmarked', () => {
    expect(monthFinalSlugs(MONTH_FINAL_EVENT_SLUGS, MONTH_FINALS_TODAY)).toEqual(EXPECTED_MONTH_FINALS);
    expect(monthFinalSlugs([], MONTH_FINALS_TODAY), 'no events mean no finals').toEqual(new Set());
  });
});

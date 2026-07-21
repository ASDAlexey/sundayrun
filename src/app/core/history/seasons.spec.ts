import { describe, expect, it } from 'vitest';

import { seasonOfIso } from './seasons';
import { Season } from './seasons.enum';

describe('seasonOfIso', () => {
  it('maps every month into its calendar-year season, December closing the year’s own winter', () => {
    expect(seasonOfIso('2026-01-15')).toBe(Season.winter);
    expect(seasonOfIso('2026-02-01')).toBe(Season.winter);
    expect(seasonOfIso('2026-03-01')).toBe(Season.spring);
    expect(seasonOfIso('2026-04-12')).toBe(Season.spring);
    expect(seasonOfIso('2026-05-31')).toBe(Season.spring);
    expect(seasonOfIso('2026-06-01')).toBe(Season.summer);
    expect(seasonOfIso('2026-07-20')).toBe(Season.summer);
    expect(seasonOfIso('2026-08-31')).toBe(Season.summer);
    expect(seasonOfIso('2026-09-01')).toBe(Season.autumn);
    expect(seasonOfIso('2026-10-10')).toBe(Season.autumn);
    expect(seasonOfIso('2026-11-30')).toBe(Season.autumn);
    expect(seasonOfIso('2026-12-27')).toBe(Season.winter);
  });
});

import { badgeCatalogRows } from './badge-catalog-rows';
import { BADGE_CATALOG } from './badge-catalog.constant';
import { CATALOG_ACTIVITY, CATALOG_YEAR, CATALOG_YEAR_BADGES, EXPECTED_CATALOG_ROWS, FULL_YEAR_ACTIVITY } from './badge-catalog.mock';

describe('badgeCatalogRows', () => {
  it('lists every badge easiest first with earned years and current-season progress lines', () => {
    expect(badgeCatalogRows(CATALOG_YEAR_BADGES, CATALOG_ACTIVITY, CATALOG_YEAR)).toEqual(EXPECTED_CATALOG_ROWS);
  });

  it('drops every progress line once the year meets all the criteria', () => {
    const rows = badgeCatalogRows([], FULL_YEAR_ACTIVITY, CATALOG_YEAR);

    expect(
      rows.map((row) => row.progressText),
      'met criteria show no progress',
    ).toEqual(BADGE_CATALOG.map(() => null));
    expect(
      rows.map((row) => row.earnedYearsText),
      'nothing awarded — no years anywhere',
    ).toEqual(BADGE_CATALOG.map(() => null));
    expect(
      rows.every((row) => !row.isEarned),
      'every chip stays locked',
    ).toBe(true);
  });
});

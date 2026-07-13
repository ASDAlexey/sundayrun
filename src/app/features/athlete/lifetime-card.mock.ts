import { LifetimeView } from './lifetime-card.interface';

/** LIFETIME_RUNS prepared for the template: the skipped 25th minute keeps its zero bar. */
export const EXPECTED_LIFETIME_VIEW: LifetimeView = {
  totalTimeText: '1:26:30',
  totalKmText: '17,3',
  buckets: [
    { minute: 24, label: '24:xx', count: 2, widthPercent: 100 },
    { minute: 25, label: '25:xx', count: 0, widthPercent: 0 },
    { minute: 26, label: '26:xx', count: 1, widthPercent: 50 },
  ],
  yearPaces: [
    { year: '2024', paceText: '5:04' },
    { year: '2025', paceText: '4:58' },
  ],
};

/** SHORT_ONLY_RUNS prepared for the template: the totals stand, both 5 km blocks are gone. */
export const EXPECTED_SHORT_ONLY_VIEW: LifetimeView = {
  totalTimeText: '11:00',
  totalKmText: '2,3',
  buckets: [],
  yearPaces: [],
};

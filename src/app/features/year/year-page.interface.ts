import { YearBadgeType } from '../../core/history/year-badges.enum';

/** One preformatted counter card of the year («Забегов» — «49»). */
export interface YearStatView {
  label: string;
  value: string;
}

/** A year's best result prepared for the template: the athlete and the race it was set at. */
export interface YearBestResultView {
  label: string;
  displayName: string;
  athleteLink: string[];
  timeText: string;
  raceLink: string[];
}

/** One row of the «самые активные» list. */
export interface YearActiveView {
  displayName: string;
  athleteLink: string[];
  countText: string;
}

export interface YearBadgeHolderView {
  displayName: string;
  athleteLink: string[];
}

/** One badge with everyone who earned it this year. */
export interface YearBadgeGroupView {
  badge: YearBadgeType;
  holders: YearBadgeHolderView[];
}

/** The whole review prepared for the template. */
export interface YearReviewView {
  year: string;
  stats: YearStatView[];
  bests: YearBestResultView[];
  mostActive: YearActiveView[];
  badgeGroups: YearBadgeGroupView[];
}

import { YearBadgeType } from '../../core/history/year-badges.enum';
import { YearStatusType } from './year-page.enum';

/** One preformatted counter card of the year («Забегов» — «49»). */
export interface YearStatView {
  label: string;
  value: string;
}

/** The resolved page payload, baked into TransferState per year so the browser trusts it. */
export interface YearPageState {
  status: YearStatusType;
  years: string[];
  view: YearReviewView | null;
}

/** One row of a «лучшие результаты года» board: place, athlete, time and the race it was run at. */
export interface YearBestRowView {
  place: number;
  displayName: string;
  athleteLink: string[];
  timeText: string;
  dateShort: string;
  raceLink: string[];
}

/** One row of the «самые активные» board. */
export interface YearActiveView {
  place: number;
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
  bestMen: YearBestRowView[];
  bestWomen: YearBestRowView[];
  mostActive: YearActiveView[];
  badgeGroups: YearBadgeGroupView[];
}

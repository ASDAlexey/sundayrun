import { GenderType } from '../../core/models/gender.enum';

/**
 * One leaderboard row prepared for the template: place, links and preformatted values. `crowned`
 * marks the current record holder — the first athlete to run the board's top time, who keeps the
 * record even when a later tie shares the first place.
 */
export interface BestResultView {
  place: number;
  key: string;
  athleteLink: string[];
  displayName: string;
  timeText: string;
  dateShort: string;
  raceLink: string[];
  crowned: boolean;
}

/** The standing first-lap (2.3 km) record card, one per gender; null keeps the vacant note. */
export interface FirstLapRecordView {
  key: string;
  athleteLink: string[];
  displayName: string;
  timeText: string;
  dateShort: string;
  raceLink: string[];
}

/** One athlete picked (or suggested) in the season-race «find yourself» search. */
export interface ChartPick {
  key: string;
  displayName: string;
}

/** One row of the combined М+Ж «Рейтинг» board prepared for the template. */
export interface RatingRowView {
  place: number;
  key: string;
  athleteLink: string[];
  displayName: string;
  /** The row's gender — the page-level filter cuts the mixed board by it. */
  gender: GenderType;
  /** «М»/«Ж» — the honest table mixes the genders, so each row names its own. */
  genderText: string;
  /** «98,4» — the form index the board ranks by. */
  formText: string;
  /** «92» — the all-time average percent of the own-gender winner. */
  rankText: string;
  /** «96,5» — the percent of the own-gender course record; a dash without one. */
  gradeText: string;
}

/** One weather extreme prepared for the template: «❄️ −14°» plus the wind detail and the race link. */
export interface WeatherExtremeView {
  label: string;
  valueText: string;
  /** The secondary reading: the wind of a temperature record, the temperature of the wind record. */
  detailText: string;
  dateShort: string;
  raceLink: string[];
}

/** One record progression step for the timeline, newest first; the head is the current record. */
export interface CourseRecordView {
  key: string;
  athleteLink: string[];
  displayName: string;
  timeText: string;
  dateShort: string;
  raceLink: string[];
  improvementText: string | null;
  current: boolean;
}

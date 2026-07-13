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

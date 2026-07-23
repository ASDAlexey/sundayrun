import { AthleteFirstLap } from '../../core/history/first-lap.interface';
import { AthleteRecord } from '../../core/models/athlete-history.interface';
import { DuelStatusType } from './versus-page.enum';

/** The resolved duel state for one pair of route keys, applied atomically after the load settles. */
export interface VersusDuelState {
  status: DuelStatusType;
  left: AthleteRecord | null;
  right: AthleteRecord | null;
  /** Both duelists' recorded first-lap splits — the «кто лидировал на 2,3 км» garnish. */
  leftLaps: AthleteFirstLap[];
  rightLaps: AthleteFirstLap[];
}

/** One side of the scoreboard prepared for the template. */
export interface DuelSideView {
  key: string;
  displayName: string;
  athleteLink: string[];
  wins: number;
}

/** One search match prepared for the picker dropdown; the best time disambiguates namesakes. */
export interface AthleteOptionView {
  key: string;
  displayName: string;
  bestTimeText: string;
}

/** One shared race prepared for the template: preformatted times with the winning side flagged. */
export interface MeetingView {
  slug: string;
  raceLink: string[];
  dateShort: string;
  leftTimeText: string;
  rightTimeText: string;
  leftWon: boolean;
  rightWon: boolean;
  gapText: string;
  /** The flag of the side that led after the first lap; both false without plausible splits or on a tie. */
  leftLedSplit: boolean;
  rightLedSplit: boolean;
}

import { TimerAnnouncementKindType } from './timer-announcement.enum';

/** One line for the live region: who, what happened and at what time. */
export interface TimerAnnouncement {
  kind: TimerAnnouncementKindType;
  name: string;
  timeText: string;
}

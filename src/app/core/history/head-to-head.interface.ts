/** One event both athletes finished on the full course; sides mirror the builder's argument order. */
export interface HeadToHeadMeeting {
  slug: string;
  dateIso: string;
  leftMs: number;
  rightMs: number;
}

/** The duel of two athletes over their shared 5 km races: a parkrun-style «встречались 14 раз, счёт 9:5». */
export interface HeadToHead {
  meetingCount: number;
  leftWins: number;
  rightWins: number;
  draws: number;
  /** Newest first, ready for the meetings timeline. */
  meetings: HeadToHeadMeeting[];
}

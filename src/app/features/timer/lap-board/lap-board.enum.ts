/**
 * What the archive has to say about a lap that was just recorded. A lap under the course record is
 * automatically under the runner's own best as well — the record is the fastest lap the archive
 * holds — so the two marks are one choice, not two lines.
 */
export const TimerLapMark = { courseRecord: 'courseRecord', personalBest: 'personalBest' } as const;
export type TimerLapMarkType = (typeof TimerLapMark)[keyof typeof TimerLapMark];

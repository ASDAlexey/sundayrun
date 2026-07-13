/** The run holding an athlete's all-time 5 km best before some event — the target of the «ЛР (было X)» link. */
export interface PreviousBest {
  slug: string;
  dateIso: string;
  timeMs: number;
}

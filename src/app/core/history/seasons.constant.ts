import { Season, SeasonType } from './seasons.enum';

/** 'MM' of an ISO date → its calendar-year season. */
export const MONTH_SEASONS: Record<string, SeasonType> = {
  '01': Season.winter,
  '02': Season.winter,
  '03': Season.spring,
  '04': Season.spring,
  '05': Season.spring,
  '06': Season.summer,
  '07': Season.summer,
  '08': Season.summer,
  '09': Season.autumn,
  '10': Season.autumn,
  '11': Season.autumn,
  '12': Season.winter,
};

/** The 'MM' slice bounds of an ISO 'YYYY-MM-DD' date. */
export const ISO_MONTH_START = 5;

export const ISO_MONTH_END = 7;

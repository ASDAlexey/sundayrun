import { Gender } from '../models/gender.enum';
import { EventRef, EventResult } from './athletes-rollup.interface';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { AutoNoteInput } from './notes-builder.interface';

export const SEASON_OPENER_EVENT: EventRef = { slug: 'kuzminki-1', dateIso: '2026-01-03' };

/**
 * Rolled into an empty history: sets the 2026 year bests — 25:00 (M, Иванов) and 27:00 (F, Петрова).
 * Волков's DNF leaves him a gendered record without a year best, and the genderless Хмелёв holds
 * one that must never reach the per-gender bests: both are skipped by the year-best fold.
 */
export const SEASON_OPENER_RESULTS: EventResult[] = [
  { fullName: 'Иванов Иван', gender: Gender.male, timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
  { fullName: 'Сидоров Пётр', gender: Gender.male, timeMs: 1560000, distanceKm: FIVE_KM_DISTANCE_KM },
  { fullName: 'Петрова Анна', gender: Gender.female, timeMs: 1620000, distanceKm: FIVE_KM_DISTANCE_KM },
  { fullName: 'Волков Лев', gender: Gender.male, timeMs: null, distanceKm: FIVE_KM_DISTANCE_KM },
  { fullName: 'Хмелёв Ким', gender: null, timeMs: 1800000, distanceKm: FIVE_KM_DISTANCE_KM },
];

export const NEXT_EVENT_DATE_ISO = '2026-01-10';

/**
 * The next event's results deliberately NOT in finishing order: Сидоров (24:50) is listed before
 * the faster Иванов (24:40), yet the year-best note must go to Иванов only — the notes are folded
 * in ascending-time order, and Сидоров's personal record no longer beats the day's new year best.
 */
export const NEXT_EVENT_INPUTS: AutoNoteInput[] = [
  { key: 'сидоров петр', gender: Gender.male, timeMs: 1490000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: NEXT_EVENT_DATE_ISO },
  { key: 'иванов иван', gender: Gender.male, timeMs: 1480000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: NEXT_EVENT_DATE_ISO },
  { key: 'петрова анна', gender: Gender.female, timeMs: 1560000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: NEXT_EVENT_DATE_ISO },
  { key: 'новикова юлия', gender: Gender.female, timeMs: 1700000, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: NEXT_EVENT_DATE_ISO },
  // Two DNFs, so the finishing-order sort has to weigh a missing time on BOTH sides of a comparison.
  { key: 'козлов олег', gender: Gender.male, timeMs: null, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: NEXT_EVENT_DATE_ISO },
  { key: 'мороз давид', gender: Gender.male, timeMs: null, distanceKm: FIVE_KM_DISTANCE_KM, dateIso: NEXT_EVENT_DATE_ISO },
];

/** Positional expectations for `NEXT_EVENT_INPUTS`: records combine with the per-gender year best. */
export const NEXT_EVENT_EXPECTED_NOTES: string[] = [
  'ЛР (было 26:00)',
  'ЛР (было 25:00); Лучший результат 2026 г.',
  'ЛР (было 27:00); Лучший результат 2026 г.',
  'Первое участие',
  '',
  '',
];

/** Against an empty history everyone is a first-timer and no year best exists to beat. */
export const OPENER_INPUTS: AutoNoteInput[] = SEASON_OPENER_RESULTS.map((result) => ({
  key: result.fullName.toLowerCase(),
  gender: result.gender,
  timeMs: result.timeMs,
  distanceKm: result.distanceKm,
  dateIso: SEASON_OPENER_EVENT.dateIso,
}));

/** Волков's DNF stays note-less even on a first showing; the genderless Хмелёв is still a first-timer. */
export const OPENER_EXPECTED_NOTES: string[] = ['Первое участие', 'Первое участие', 'Первое участие', '', 'Первое участие'];

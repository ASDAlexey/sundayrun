import { EventResult } from '../history/athletes-rollup.interface';
import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from '../history/distance.constant';
import { Gender } from '../models/gender.enum';
import { DNF_DISTANCE_KM } from './results-file.constant';

/** Mapped from `PROTOCOL_ROWS`; the DNF row is kept with a null time and the stub distance. */
export const EXPECTED_EVENT_RESULTS: EventResult[] = [
  { fullName: 'Мария Иванова', gender: Gender.female, timeMs: 1500000, distanceKm: FIVE_KM_DISTANCE_KM },
  { fullName: 'Олег Петров', gender: Gender.male, timeMs: 900000, distanceKm: TWO_THREE_KM_DISTANCE_KM },
  { fullName: 'Пётр Сидоров', gender: null, timeMs: null, distanceKm: DNF_DISTANCE_KM },
];

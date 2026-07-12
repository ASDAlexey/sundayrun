import { FIVE_KM_DISTANCE_KM, TWO_THREE_KM_DISTANCE_KM } from '../../history/distance.constant';
import { Gender } from '../../models/gender.enum';
import { ProtocolRow } from '../../models/protocol-row.interface';
import { RaceEvent } from '../../models/race-event.interface';

export const RACE_EVENT: RaceEvent = {
  number: 12,
  legacyNumber: null,
  dateIso: '2026-06-28',
  city: 'Курск',
  park: 'Боева дача',
  clubName: 'Курск бегущий',
  chairman: 'Иванов Иван',
};

/** A 5 km finisher, a 2.3 km one-lap runner and a DNF (null `totalMs`/`distanceKm`). */
export const PROTOCOL_ROWS: ProtocolRow[] = [
  {
    index: 1,
    fullName: 'Мария Иванова',
    time23: '11:30',
    time5: '25:00',
    totalMs: 1500000,
    distanceKm: FIVE_KM_DISTANCE_KM,
    gender: Gender.female,
    placeM: null,
    placeF: 1,
    club: 'Курск бегущий',
    note: '',
  },
  {
    index: 2,
    fullName: 'Олег Петров',
    time23: '15:00',
    time5: '',
    totalMs: 900000,
    distanceKm: TWO_THREE_KM_DISTANCE_KM,
    gender: Gender.male,
    placeM: 1,
    placeF: null,
    club: '',
    note: '',
  },
  {
    index: 3,
    fullName: 'Пётр Сидоров',
    time23: '',
    time5: '',
    totalMs: null,
    distanceKm: null,
    gender: null,
    placeM: null,
    placeF: null,
    club: '',
    note: 'сход',
  },
];

import { ProtocolRow } from '../models/protocol-row.interface';
import { FIVE_KM_DISTANCE_KM } from './distance.constant';
import { RaceSummary } from './race-summary.interface';

/**
 * Six finishers and a DNF: a plain finisher, two newcomers (one with organiser text appended),
 * two personal records (canonical and legacy spellings; the year-best token must not add a third)
 * and a manual-only 'Рекорд трассы' note that counts as nothing but a finish.
 */
export const RACE_SUMMARY_ROWS: ProtocolRow[] = [
  summaryRow(1, 1500000, ''),
  summaryRow(2, 1550000, 'Первое участие'),
  summaryRow(3, 1600000, 'Первое участие; Дети'),
  summaryRow(4, 1400000, 'ЛР (было 24:40); Лучший результат 2026 г.'),
  summaryRow(5, 1450000, 'Личный рекорд'),
  summaryRow(6, 1350000, 'Рекорд трассы'),
  summaryRow(7, null, 'сход'),
];

export const EXPECTED_RACE_SUMMARY: RaceSummary = {
  finisherCount: 6,
  newcomerCount: 2,
  personalRecordCount: 2,
};

export const EMPTY_RACE_SUMMARY: RaceSummary = {
  finisherCount: 0,
  newcomerCount: 0,
  personalRecordCount: 0,
};

function summaryRow(index: number, totalMs: number | null, note: string): ProtocolRow {
  return {
    index,
    fullName: `Атлет ${index}`,
    time23: '',
    time5: '',
    totalMs,
    distanceKm: totalMs === null ? null : FIVE_KM_DISTANCE_KM,
    gender: null,
    placeM: null,
    placeF: null,
    club: '',
    note,
  };
}

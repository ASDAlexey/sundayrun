import { TimerFinishRow } from './finish-board.interface';

/**
 * The protocol the fixture session produces: three 5 km finishers by time (the third one has no gender
 * yet, so she gets no place), then the runner who stopped after the lap, then the three DNFs in roster
 * order — one tap left alone, an explicit DNF and somebody nobody tapped.
 */
export const FINISH_EXPECTED_ROWS: TimerFinishRow[] = [
  { fullName: 'Троилин Антон', index: 1, out: false, paceText: '4:41', placeText: '1', time23: '9:26', time5: '23:26' },
  { fullName: 'Попов Алексей', index: 2, out: false, paceText: '5:16', placeText: '2', time23: '11:41', time5: '26:20' },
  { fullName: 'Соколова Анна', index: 3, out: false, paceText: '5:24', placeText: '', time23: '12:00', time5: '27:00' },
  { fullName: 'Романенко Елена', index: 4, out: true, paceText: '4:56', placeText: '', time23: '11:20', time5: '' },
  { fullName: 'Попов Игорь', index: 5, out: true, paceText: '', placeText: '', time23: '', time5: '' },
  { fullName: 'Иванов Дмитрий', index: 6, out: true, paceText: '', placeText: '', time23: '', time5: '' },
  { fullName: 'Кузнецов Пётр', index: 7, out: true, paceText: '', placeText: '', time23: '', time5: '' },
];

/** The two nameless times of the fixture, formatted the way the block lists them. */
export const FINISH_EXPECTED_UNASSIGNED_TIMES = ['27:35', '28:10'];

/** What the block calls them. */
export const FINISH_EXPECTED_UNASSIGNED_TEXT = '2 времени без имени';

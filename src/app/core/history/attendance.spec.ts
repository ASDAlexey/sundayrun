import { attendanceBoard, seasonAttendance } from './attendance';
import {
  ATTENDANCE_LATE_YEAR,
  ATTENDANCE_RECORDS,
  EXPECTED_ATTENDANCE_BOARD,
  EXPECTED_LATE_YEAR_BOARD,
  EXPECTED_SEASON_ATTENDANCE,
  EXPECTED_SUMMER_BOARD,
} from './attendance.mock';
import { Season } from './seasons.enum';

describe('attendanceBoard', () => {
  it('ranks by finish count with shared places, scoped by year and by season', () => {
    expect(attendanceBoard(ATTENDANCE_RECORDS, null, null), 'the 2.3 km run and the DNF-only athlete stay out').toEqual(
      EXPECTED_ATTENDANCE_BOARD,
    );
    expect(attendanceBoard(ATTENDANCE_RECORDS, ATTENDANCE_LATE_YEAR, null)).toEqual(EXPECTED_LATE_YEAR_BOARD);
    expect(attendanceBoard(ATTENDANCE_RECORDS, null, Season.summer), 'a seasonless year sums that season over the archive').toEqual(
      EXPECTED_SUMMER_BOARD,
    );
    expect(attendanceBoard(ATTENDANCE_RECORDS, ATTENDANCE_LATE_YEAR, Season.winter), 'no 2026 winter starts').toEqual([]);
    expect(attendanceBoard([], null, null)).toEqual([]);
  });

  it('builds the season podiums in calendar order, skipping a season nobody ran', () => {
    expect(seasonAttendance(ATTENDANCE_RECORDS, null)).toEqual(EXPECTED_SEASON_ATTENDANCE);
    expect(seasonAttendance(ATTENDANCE_RECORDS, ATTENDANCE_LATE_YEAR).map((podium) => podium.season)).toEqual([Season.summer]);
  });
});

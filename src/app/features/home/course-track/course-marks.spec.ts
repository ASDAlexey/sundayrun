import { COURSE_LAP_MARK_METERS } from './course-track.constant';
import { buildCourseMarks } from './course-marks';

describe('buildCourseMarks', () => {
  const marks = buildCourseMarks();

  it('gives every kilometre balloon its own reading and the lap balloon both of its own', () => {
    expect(marks.filter((mark) => mark.lap === 0).map((mark) => mark.meters)).toEqual([[2000], [3000], [1000], [4000]]);
    expect(marks.find((mark) => mark.lap > 0)?.meters, 'one line, crossed twice').toEqual(COURSE_LAP_MARK_METERS);
  });

  it('leaves a kilometre balloon on its point and slides the lap balloon off the start line', () => {
    const kilometre = marks.find((mark) => mark.km === '3');
    const lap = marks.find((mark) => mark.lap > 0);

    expect([kilometre?.bx, kilometre?.by]).toEqual([kilometre?.x, kilometre?.y]);
    expect(lap?.bx).not.toBe(lap?.x);
    expect(Math.abs((lap?.bx ?? 0) - (lap?.lx ?? 0)), 'and stops short of its own caption').toBeGreaterThan(0);
  });
});

import { COURSE_MARKS } from './course-geometry.constant';
import { COURSE_LAP_MARK_METERS, COURSE_LAP_MARK_SHIFT, COURSE_METERS_IN_KM } from './course-track.constant';
import { type CourseMark } from './course-marks.interface';

/**
 * The generated marks, finished into something drawable.
 *
 * The generator knows where the route passes each kilometre and where a caption for it would fit;
 * it does not know that the lap balloon has to get out of the start disc's way, or that the lap
 * line is crossed twice. Both are facts about how the course is read rather than about its
 * geometry, so they are added here — once, for the map on the page and for the poster a visitor
 * saves, which have to agree down to the pixel or the saved picture is of a different course.
 */
export function buildCourseMarks(): readonly CourseMark[] {
  return COURSE_MARKS.map((mark) => ({
    ...mark,
    // The 2,3 km split is taken on the start line itself, so its balloon and the start disc want
    // the same square centimetre. Slid along the ray its caption already uses, it sits beside the
    // line the way a timing mat does, and both marks survive.
    bx: mark.lap > 0 ? mark.x + (mark.lx - mark.x) * COURSE_LAP_MARK_SHIFT : mark.x,
    by: mark.lap > 0 ? mark.y + (mark.ly - mark.y) * COURSE_LAP_MARK_SHIFT : mark.y,
    // A kilometre balloon is one reading on the clock; the lap balloon is two, because the runner
    // passes that line on the way out and again on the way back and only the clock tells them apart.
    meters: mark.lap > 0 ? COURSE_LAP_MARK_METERS : [Number(mark.km) * COURSE_METERS_IN_KM],
  }));
}

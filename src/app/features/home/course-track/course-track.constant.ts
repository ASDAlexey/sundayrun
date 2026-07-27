/**
 * The course as the club declares it, which is not quite what a GPS watch reports.
 *
 * A recording of the route came to 5018 m — the excess is receiver noise and the line the
 * runner actually took, not extra course. The distance people race, compare and put in the
 * protocol is a round 5 km, split 2300 + 2300 + 400, and that is the only distance the page
 * ever shows. The measured figures live in `course-geometry.constant.ts` and are used for
 * one thing: deciding *when* along the animation each lap ends.
 */
export const COURSE_TOTAL_METERS = 5000;

/** One big lap. The protocol records a split here — the site quotes it as «первый круг, 2,3 км». */
export const COURSE_LAP_METERS = 2300;

/** The short lap that tops the two big ones up to five kilometres. */
export const COURSE_FINAL_LAP_METERS = 400;

/** Radius of the travelling marker in viewBox units — about two metres of park. */
export const COURSE_RUNNER_RADIUS = 11;

/**
 * Radius of the start and finish discs — the size of a kilometre balloon, because they answer the
 * question people open the map with. The runner is smaller and it still reads as the moving thing:
 * it is the only mark that moves.
 */
export const COURSE_PIN_RADIUS = 13;

/**
 * Where the runners gather, as an offset from the start line in viewBox units.
 *
 * Transcribed from the club's own schematic — OpenStreetMap has nothing at the spot — where the
 * gathering point is drawn a few strides north of the start, by the pull-up bars off Гоголевский.
 * Worth confirming on the ground before anyone follows it: this is wayfinding, not decoration.
 *
 * Pushed further up the alley and a little into the park than the strides warrant, so that the
 * label, the arrow and the start disc are three separate objects rather than one red smudge. The
 * arrow is what carries the actual claim — the gathering point is up this way — and an arrow
 * needs a length to be read as one.
 */
export const COURSE_MEETING_OFFSET = { x: 20, y: -66 };

/**
 * How far the lap balloon slides off the line towards its own label, as a fraction of that gap.
 *
 * The 2,3 km split is taken on the start line itself, so its balloon and the start disc want the
 * same square centimetre and the larger of the two wins. Moved along the ray the label already
 * uses, it sits beside the line the way a timing mat sits beside one, and both marks survive.
 */
export const COURSE_LAP_MARK_SHIFT = 0.62;

/**
 * When the map starts playing by itself.
 *
 * A fraction rather than «any part of it»: the run is worth watching only once the whole course is
 * in the frame, and a map that starts the moment its top edge appears plays its first lap off
 * screen. Two thirds is the point where the drawing is committed on a laptop and still reachable
 * on a phone, where the map is a third of the viewport tall.
 */
export const COURSE_AUTOPLAY_OBSERVER_OPTIONS: IntersectionObserverInit = { threshold: 0.66 };

/** The visitor has asked for less movement — the map stays a still drawing and the button goes. */
export const COURSE_REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * How long a play-through lasts.
 *
 * Not a scaled-down 23 minutes — a replay nobody watches to the end teaches nothing. Fourteen
 * seconds is long enough to read the shape of each lap and short enough that the whole thing
 * finishes before attention does.
 */
export const COURSE_PLAY_SECONDS = 14;

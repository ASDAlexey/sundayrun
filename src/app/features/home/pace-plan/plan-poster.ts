import {
  COURSE_FINAL_LAP_PATH,
  COURSE_FINISH_POINT,
  COURSE_LAP_ONE_PATH,
  COURSE_LAP_TWO_PATH,
  COURSE_START_POINT,
  COURSE_VIEW_BOX,
} from '../course-track/course-geometry.constant';
import { COURSE_PIN_RADIUS } from '../course-track/course-track.constant';
import { type CourseMark } from '../course-track/course-marks.interface';
import { buildCourseMarks } from '../course-track/course-marks';
import {
  POSTER_BALLOON_RADIUS,
  POSTER_BALLOON_TEXT_SIZE,
  POSTER_CAPTION_LEADING,
  POSTER_CAPTION_SIZE,
  POSTER_DISC_RING_WIDTH,
  POSTER_FOOTER_HEIGHT,
  POSTER_FOOTER_SIZE,
  POSTER_HEADER_HEIGHT,
  POSTER_MAP_GAP,
  POSTER_PACE_SIZE,
  POSTER_PADDING,
  POSTER_ROUTE_CASING_WIDTH,
  POSTER_ROUTE_WIDTH,
  POSTER_ROW_HEIGHT,
  POSTER_ROW_SIZE,
  POSTER_RULE_WIDTH,
  POSTER_TARGET_BASELINE,
  POSTER_TARGET_SIZE,
  POSTER_TITLE_BASELINE,
  POSTER_TITLE_SIZE,
  POSTER_TITLE_SPACING,
  POSTER_WIDTH,
} from './plan-poster.constant';
import { type PosterInput, type PosterPalette, type PosterRow } from './plan-poster.interface';

const [, , COURSE_VIEW_WIDTH, COURSE_VIEW_HEIGHT] = COURSE_VIEW_BOX.split(' ').map(Number);

const CONTENT_WIDTH = POSTER_WIDTH - POSTER_PADDING * 2;

const MAP_HEIGHT = (CONTENT_WIDTH * COURSE_VIEW_HEIGHT) / COURSE_VIEW_WIDTH;

const TABLE_TOP = POSTER_HEADER_HEIGHT + MAP_HEIGHT + POSTER_MAP_GAP;

/**
 * The plan as a picture to keep — the map with the times on it, and the same times as a table
 * under it, on one sheet the size of a phone screenshot.
 *
 * It exists because of where a plan is actually used. The card is on a page read on Saturday
 * evening; the plan is for eight on Sunday morning, at a start line, on a phone that may have no
 * signal in the park. A screenshot of the card would carry the form controls and cut the map in
 * half, so the poster is drawn for the purpose instead: nothing on it is interactive, and
 * everything on it is legible at arm's length.
 *
 * SVG, built as a string rather than drawn. The layout is then a pure function a test can read,
 * the course arrives as the very path data the site draws — so the saved picture cannot drift
 * into being a different course — and rasterising is left to the one small step that needs a
 * browser.
 */
export function buildPlanPoster(input: PosterInput): string {
  const height = TABLE_TOP + input.rows.length * POSTER_ROW_HEIGHT + POSTER_FOOTER_HEIGHT;
  const size = `width="${POSTER_WIDTH}" height="${round(height)}" viewBox="0 0 ${POSTER_WIDTH} ${round(height)}"`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" ${size} font-family="ui-monospace, Menlo, monospace">`,
    `<rect width="100%" height="100%" fill="${input.palette.paper}"/>`,
    header(input),
    map(input),
    input.rows.map((row, index) => tableRow({ row, index, palette: input.palette })).join(''),
    footer(input, height),
    '</svg>',
  ].join('');
}

function header({ title, finishText, paceText, palette }: PosterInput): string {
  return [
    text(title, {
      x: POSTER_PADDING,
      y: POSTER_TITLE_BASELINE,
      size: POSTER_TITLE_SIZE,
      fill: palette.inkSoft,
      spacing: POSTER_TITLE_SPACING,
    }),
    text(finishText, { x: POSTER_PADDING, y: POSTER_TARGET_BASELINE, size: POSTER_TARGET_SIZE, fill: palette.ink, weight: BOLD }),
    text(paceText, {
      x: POSTER_WIDTH - POSTER_PADDING,
      y: POSTER_TARGET_BASELINE,
      size: POSTER_PACE_SIZE,
      fill: palette.accent,
      anchor: 'end',
    }),
  ].join('');
}

/**
 * The course at the poster's own scale, in a nested `<svg>` so every coordinate the site generated
 * is used unchanged rather than transformed and rounded a second time.
 *
 * Without the park underneath it: the basemap is an external file, and an external file is exactly
 * what a picture meant to survive on a phone with no signal cannot contain. The route, the two
 * discs and the marks are the whole of what a plan needs anyway.
 */
function map(input: PosterInput): string {
  const { palette } = input;
  const routes = [COURSE_LAP_ONE_PATH, COURSE_LAP_TWO_PATH, COURSE_FINAL_LAP_PATH];
  const frame = `x="${POSTER_PADDING}" y="${POSTER_HEADER_HEIGHT}" width="${CONTENT_WIDTH}" height="${round(MAP_HEIGHT)}"`;

  return [
    `<svg ${frame} viewBox="${COURSE_VIEW_BOX}">`,
    routes.map((path) => stroke(path, { color: palette.routeCasing, width: POSTER_ROUTE_CASING_WIDTH })).join(''),
    routes.map((path) => stroke(path, { color: palette.route, width: POSTER_ROUTE_WIDTH })).join(''),
    disc(COURSE_START_POINT, { fill: palette.mark, ring: palette.paper }),
    disc(COURSE_FINISH_POINT, { fill: palette.ink, ring: palette.paper }),
    buildCourseMarks()
      .map((mark) => balloon(mark, input))
      .join(''),
    '</svg>',
  ].join('');
}

function balloon(mark: CourseMark, { splits, palette }: PosterInput): string {
  const drawn: string[] = [];

  for (const [line, meters] of mark.meters.entries()) {
    const time = splits.get(meters);

    if (time !== undefined) {
      drawn.push(
        text(time, {
          x: mark.lx,
          y: mark.ly + line * POSTER_CAPTION_LEADING,
          size: POSTER_CAPTION_SIZE,
          fill: palette.accent,
          anchor: mark.anchor,
          weight: BOLD,
        }),
      );
    }
  }

  const captions = drawn.join('');

  const face = `fill="${mark.lap > 0 ? palette.mark : palette.route}" stroke="${palette.paper}" stroke-width="${POSTER_DISC_RING_WIDTH}"`;

  // The lap balloon prints nothing: on the page it wears a stopwatch glyph, and a glyph that
  // depends on the reader having an emoji font is not something to bake into a saved picture. Its
  // colour already says which kind of mark it is, and its two captions say the rest.
  const number =
    mark.km === ''
      ? ''
      : text(mark.km, {
          x: mark.bx,
          y: mark.by + POSTER_BALLOON_TEXT_SIZE / BALLOON_BASELINE_DIVISOR,
          size: POSTER_BALLOON_TEXT_SIZE,
          fill: palette.paper,
          anchor: 'middle',
          weight: BOLD,
        });

  return `<circle cx="${round(mark.bx)}" cy="${round(mark.by)}" r="${POSTER_BALLOON_RADIUS}" ${face}/>${number}${captions}`;
}

function tableRow({ row, index, palette }: { row: PosterRow; index: number; palette: PosterPalette }): string {
  const top = TABLE_TOP + index * POSTER_ROW_HEIGHT;
  const baseline = top + POSTER_ROW_HEIGHT / 2 + POSTER_ROW_SIZE / ROW_BASELINE_DIVISOR;
  const rule = `x1="${POSTER_PADDING}" y1="${round(top)}" x2="${POSTER_WIDTH - POSTER_PADDING}" y2="${round(top)}"`;

  return [
    `<line ${rule} stroke="${palette.border}" stroke-width="${POSTER_RULE_WIDTH}"/>`,
    text(row.label, { x: POSTER_PADDING, y: baseline, size: POSTER_ROW_SIZE, fill: row.lap ? palette.mark : palette.inkSoft }),
    text(row.time, {
      x: POSTER_WIDTH - POSTER_PADDING,
      y: baseline,
      size: POSTER_ROW_SIZE,
      fill: palette.ink,
      anchor: 'end',
      weight: BOLD,
    }),
  ].join('');
}

function footer({ footer: line, palette }: PosterInput, height: number): string {
  const place = { x: POSTER_WIDTH / 2, y: height - POSTER_FOOTER_HEIGHT / 2, size: POSTER_FOOTER_SIZE, fill: palette.inkSoft };

  return text(line, { ...place, anchor: 'middle' });
}

function stroke(path: string, { color, width }: { color: string; width: number }): string {
  return `<path d="${path}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function disc(point: { x: number; y: number }, { fill, ring }: { fill: string; ring: string }): string {
  const face = `fill="${fill}" stroke="${ring}" stroke-width="${POSTER_DISC_RING_WIDTH}"`;

  return `<circle cx="${point.x}" cy="${point.y}" r="${COURSE_PIN_RADIUS}" ${face}/>`;
}

function text(value: string, options: TextOptions): string {
  const anchor = options.anchor === undefined ? '' : ` text-anchor="${options.anchor}"`;
  const weight = options.weight === undefined ? '' : ` font-weight="${options.weight}"`;
  const spacing = options.spacing === undefined ? '' : ` letter-spacing="${options.spacing}"`;
  const place = `x="${round(options.x)}" y="${round(options.y)}" font-size="${options.size}" fill="${options.fill}"`;

  return `<text ${place}${anchor}${weight}${spacing}>${escapeText(value)}</text>`;
}

interface TextOptions {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  readonly fill: string;
  readonly anchor?: string;
  readonly weight?: number;
  readonly spacing?: number;
}

/**
 * The only values reaching the document from outside are labels and clock readings, but the
 * document is XML: one stray ampersand in a translation and the whole picture fails to parse.
 */
function escapeText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function round(value: number): number {
  return Math.round(value * ROUND_FACTOR) / ROUND_FACTOR;
}

const BOLD = 700;

/** Nudges a centred glyph onto the optical middle of its disc — cap height, not line height. */
const BALLOON_BASELINE_DIVISOR = 2.6;

const ROW_BASELINE_DIVISOR = 3;

const ROUND_FACTOR = 10;

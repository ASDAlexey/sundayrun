import { PaceTone, PaceToneType } from './pace-tone.enum';

/**
 * The pace bands, as a fraction of the run's own average pace — under 1 is quicker than average.
 *
 * Deliberately narrow in the middle: over five kilometres of park a runner holding anything like an
 * even pace stays inside a couple of per cent, so a wider «even» band would paint the whole course
 * one colour and the map would say nothing. The first band whose ceiling the stretch is under wins;
 * anything past the last is `slowest`.
 */
export const PACE_TONE_BANDS: { under: number; tone: PaceToneType }[] = [
  { under: 0.95, tone: PaceTone.fastest },
  { under: 0.985, tone: PaceTone.fast },
  { under: 1.015, tone: PaceTone.even },
  { under: 1.05, tone: PaceTone.slow },
];

/**
 * How far apart two drawn points have to be, in viewBox units, for the second to be kept.
 *
 * The frame runs at about two units to the metre, and a watch samples every second — some ten units
 * at racing pace, four or five rendered pixels. Eight units is a stride or two of park: every bend
 * the runner actually took survives, and two thirds of the samples do not reach the DOM.
 */
export const TRACE_MIN_STEP_UNITS = 8;

/**
 * How long the replay lasts, in seconds — the same fourteen the course map on the home page runs
 * for, since the two animations sit on the same site and one of them has already been calibrated
 * against people's patience.
 *
 * The marker keeps the run's own time distribution rather than a constant speed: fourteen seconds
 * of watching yourself fade in the third kilometre is the point of the card.
 */
export const REPLAY_SECONDS = 14;

/** The travelling marker, in viewBox units — a little smaller than the start and finish discs. */
export const MARKER_RADIUS = 10;

/**
 * The shortest gap between two samples the marker will interpolate over, in seconds. A watch that
 * logged twice within one second would otherwise put a zero under the division.
 */
export const MARKER_MIN_SPAN_S = 0.001;

export const PIN_RADIUS = 12;

/** Distances are printed to the metre — the watch's own second decimal of a kilometre. */
export const KM_FRACTION_DIGITS = 2;

/** The pace chart's own box; CSS stretches it to the card. */
export const CHART_WIDTH = 560;

export const CHART_HEIGHT = 140;

export const CHART_PAD = 10;

/** Chart coordinates are rounded to tenths — plenty for SVG, and shorter in the DOM. */
export const COORD_TENTHS_BASE = 10;

/**
 * How much of the pace range the chart shows around the average.
 *
 * A GPS receiver under trees produces the occasional stride at half pace, and a chart scaled to the
 * extremes would flatten the whole run into a line with one spike. Clamped to a quarter either side
 * of the average, the shape of the race is what fills the box.
 */
export const CHART_PACE_SPREAD = 0.25;

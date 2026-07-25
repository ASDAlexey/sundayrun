import { Gender } from '../../../core/models/gender.enum';
import { TimerRunnerOutcome } from '../../../core/timer/timer-session.enum';
import { TimerRunner } from '../../../core/timer/timer-session.interface';

/**
 * Where the finger is and when. jsdom ships no `PointerEvent`, and `MouseEventInit` carries neither
 * `offsetX` nor `timeStamp`, so both are defined on the instance — the tile reads exactly these five
 * numbers and nothing else off the event.
 */
export interface TilePointerInit {
  clientX: number;
  clientY: number;
  offsetX: number;
  offsetY: number;
  timeStamp: number;
}

export function tilePointerEvent(type: string, init: TilePointerInit): MouseEvent {
  const event = new MouseEvent(type, { bubbles: true, clientX: init.clientX, clientY: init.clientY });

  Object.defineProperty(event, 'offsetX', { value: init.offsetX });
  Object.defineProperty(event, 'offsetY', { value: init.offsetY });
  Object.defineProperty(event, 'timeStamp', { value: init.timeStamp });

  return event;
}

export const TILE_RUNNER: TimerRunner = {
  id: 'runner-hahutsky',
  fullName: 'Хахуцкий Виктор',
  athleteKey: 'хахуцкий виктор',
  gender: Gender.male,
  outcome: TimerRunnerOutcome.active,
};

export const TILE_SURNAME = 'Хахуцкий';
export const TILE_GIVEN = 'В.';
export const TILE_TIME_TEXT = '11:08';
export const TILE_ACCENT_INDEX = 7;
export const TILE_INK_CLASS = 'timer-tile_ink-7';

/** The ripple has to start under the finger, so the origin is the offset, in pixels. */
export const TILE_TAP_X = '12px';
export const TILE_TAP_Y = '9px';

/** Before any tap the origin is the centre, so a keyboard cut still looks right. */
export const TILE_TAP_CENTRE = '50%';

/** The finger lands. */
export const TILE_DOWN: TilePointerInit = { clientX: 100, clientY: 200, offsetX: 12, offsetY: 9, timeStamp: 1_000 };

/** A second press 300 ms later — inside the 400 ms guard, so it is a stutter, not a cut. */
export const TILE_DOWN_REPEAT: TilePointerInit = { ...TILE_DOWN, timeStamp: 1_300 };

/** And one 600 ms later, which is a deliberate second tap. */
export const TILE_DOWN_LATE: TilePointerInit = { ...TILE_DOWN, timeStamp: 1_600 };

/** And a third, another 600 ms on, for the sequences that need three separate cuts. */
export const TILE_DOWN_THIRD: TilePointerInit = { ...TILE_DOWN, timeStamp: 2_200 };

/** A fourth, for a sequence that runs the whole length of a spec. */
export const TILE_DOWN_FOURTH: TilePointerInit = { ...TILE_DOWN, timeStamp: 2_800 };

/** Let go where it landed, quickly: an ordinary tap and nothing else. */
export const TILE_UP_TAP: TilePointerInit = { ...TILE_DOWN, clientX: 102, clientY: 201, timeStamp: 1_120 };

/** Seventy pixels to the right, five down: «я не туда попал». */
export const TILE_UP_SWIPE_RIGHT: TilePointerInit = { ...TILE_DOWN, clientX: 170, clientY: 205, timeStamp: 1_200 };

/** Seventy pixels to the left: «сошёл». */
export const TILE_UP_SWIPE_LEFT: TilePointerInit = { ...TILE_DOWN, clientX: 30, clientY: 205, timeStamp: 1_200 };

/** Far sideways but a hundred pixels down — that is a scroll, not a swipe. */
export const TILE_UP_DIAGONAL: TilePointerInit = { ...TILE_DOWN, clientX: 170, clientY: 300, timeStamp: 1_100 };

/** Seven hundred milliseconds in one place: the runner card. */
export const TILE_UP_LONG: TilePointerInit = { ...TILE_DOWN, clientX: 101, clientY: 200, timeStamp: 1_700 };

/** The same long press, but late in a sequence that has already used the earlier stamps. */
export const TILE_UP_LONG_LATE: TilePointerInit = { ...TILE_UP_LONG, timeStamp: 3_600 };

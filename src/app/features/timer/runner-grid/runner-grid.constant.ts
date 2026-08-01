/** Up to twelve people get the largest tile: full first name spelled out under the surname. */
export const TIMER_DENSITY_LARGE_MAX = 12;

/** Thirteen to twenty-one — today's fifteen — still keep the first name spelled out. */
export const TIMER_DENSITY_MEDIUM_MAX = 21;

/** From twenty-two on the first name shrinks to an initial and the tile with it. */
export const TIMER_DENSITY_SMALL_MAX = 24;

/** From twenty-five people on, the finishers move to the shelf so the grid keeps fitting. */
export const TIMER_SHELF_MIN_RUNNERS = 25;

/** Past thirty-two the grid is expected to scroll on a phone, so the last row gets air above the keys. */
export const TIMER_SCROLL_MIN_RUNNERS = 33;

/** Deferred recompaction waits for this much silence before anything moves under the finger. */
export const TIMER_QUIET_BEFORE_RELAYOUT_MS = 3_000;

/** A drag has to be held this long, so a plain tap on a tile never turns into a reorder. */
export const TIMER_DRAG_START_DELAY_MS = 400;

/** How many `--chart-N` inks the palette offers. */
export const TIMER_INK_COUNT = 15;

/** `--chart-1` is the first ink; the hash lands in 1…15, never 0. */
export const TIMER_INK_FIRST = 1;

/** FNV-style multiplier of the name hash — an odd number coprime with the ink count. */
export const TIMER_INK_HASH_FACTOR = 31;

/** Seed of the name hash; any non-zero start keeps one-letter names apart. */
export const TIMER_INK_HASH_SEED = 7;

/** Kept below 2^31 so the running hash never leaves the safe integer range. */
export const TIMER_INK_HASH_MODULO = 1_000_003;

/** A runner with no time yet renders no time node. */
export const TIMER_TILE_EMPTY_TIME = '';

/** A single-word name has no first name to show. */
export const TIMER_TILE_EMPTY_GIVEN = '';

/** «Попов Алексей» → «А.» once the layout is too dense to spell the name out. */
export const TIMER_NAME_INITIAL_SUFFIX = '.';

/** Length of the initial cut out of a first name. */
export const TIMER_NAME_INITIAL_LENGTH = 1;

/** `indexOf` result when the full name is a single word. */
export const TIMER_NAME_NO_SEPARATOR = -1;

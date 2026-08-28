/**
 * The poster is 1080 wide because that is what a phone screenshot is, and it is the width every
 * messenger scales its previews to. Everything else here is measured off it.
 */
export const POSTER_WIDTH = 1080;

export const POSTER_PADDING = 64;

/** Header block: the title line, the target, and the pace under it. */
export const POSTER_HEADER_HEIGHT = 260;

/** Room under the map before the table starts. */
export const POSTER_MAP_GAP = 36;

export const POSTER_ROW_HEIGHT = 74;

export const POSTER_FOOTER_HEIGHT = 96;

export const POSTER_TITLE_SIZE = 34;

export const POSTER_TITLE_BASELINE = 84;

export const POSTER_TITLE_SPACING = 4;

export const POSTER_TARGET_BASELINE = 196;

export const POSTER_TARGET_SIZE = 132;

export const POSTER_PACE_SIZE = 42;

export const POSTER_ROW_SIZE = 40;

export const POSTER_FOOTER_SIZE = 26;

/**
 * Caption size inside the poster's own map, in that map's viewBox units.
 *
 * Larger than the same caption on the page, and deliberately: the map is drawn into a box 62 % of
 * its own width here, and this picture is read at arm's length in daylight rather than on a screen
 * a foot from your face.
 */
export const POSTER_CAPTION_SIZE = 42;

export const POSTER_BALLOON_RADIUS = 21;

/** How far the lap balloon's second reading drops below its first. */
export const POSTER_CAPTION_LEADING = 52;

export const POSTER_DISC_RING_WIDTH = 4;

export const POSTER_BALLOON_TEXT_SIZE = 26;

export const POSTER_ROUTE_WIDTH = 9;

export const POSTER_ROUTE_CASING_WIDTH = 17;

export const POSTER_RULE_WIDTH = 1;

/** Twice the width, so a poster opened on a desktop is not a blurry thumbnail. */
export const POSTER_PIXEL_RATIO = 2;

export const POSTER_IMAGE_TYPE = 'image/png';

export const POSTER_FILE_NAME = 'sundayrun-plan.png';

/** How the SVG reaches the rasteriser — a data URL, because a blob URL taints nothing but needs
 * revoking and this document is a few kilobytes of text. */
export const POSTER_SVG_MEDIA_TYPE = 'image/svg+xml;charset=utf-8';

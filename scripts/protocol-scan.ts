/**
 * Tells a photographed protocol sheet from an actual race photograph.
 *
 * The club attaches the signed protocol to its wall post alongside the pictures, and not always
 * first, so the strip cannot filter by position — it has to look at the image. A scan is a sheet of
 * white paper: almost every pixel is bright and nothing in it carries colour. A race photograph,
 * even a snowy one shot into a white sky, stays an order of magnitude away from both thresholds —
 * measured over the archive the two groups sit at ~0.89 versus ≤0.09 bright pixels.
 *
 * Only the thumbnail is fetched (a few tens of kilobytes), and only when a race's strip is being
 * written, so a re-run of the backfill downloads nothing.
 */
import jpeg from 'jpeg-js';

/** Above this share of near-white pixels the image is a sheet of paper, not a park. */
const SCAN_LIGHT_SHARE = 0.45;

/** …and a sheet carries no colour at all; any real photo clears this by a wide margin. */
const SCAN_SATURATION_SHARE = 0.02;

/** Luma above which a pixel counts as «paper white». */
const LIGHT_THRESHOLD = 235;

/** Channel spread above which a pixel counts as coloured. */
const SATURATION_THRESHOLD = 40;

const RGBA_STRIDE = 4;

const [LUMA_R, LUMA_G, LUMA_B] = [0.299, 0.587, 0.114];

/** The two shares an image is judged by; exported so a probe can print them. */
export interface ImageTone {
  lightShare: number;
  saturatedShare: number;
}

export function measureTone(bytes: Uint8Array): ImageTone {
  const { data, width, height } = jpeg.decode(bytes, { useTArray: true });
  const pixels = width * height;
  let light = 0;
  let saturated = 0;

  for (let offset = 0; offset < data.length; offset += RGBA_STRIDE) {
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];

    if (LUMA_R * red + LUMA_G * green + LUMA_B * blue > LIGHT_THRESHOLD) {
      light += 1;
    }

    if (Math.max(red, green, blue) - Math.min(red, green, blue) > SATURATION_THRESHOLD) {
      saturated += 1;
    }
  }

  return { lightShare: light / pixels, saturatedShare: saturated / pixels };
}

/**
 * Whether the thumbnail at `url` is a protocol scan. A download or decode that fails answers
 * «no»: keeping a photograph we could not read beats dropping one on a network hiccup.
 */
export async function isProtocolScan(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return false;
    }

    const { lightShare, saturatedShare } = measureTone(new Uint8Array(await response.arrayBuffer()));

    return lightShare >= SCAN_LIGHT_SHARE && saturatedShare <= SCAN_SATURATION_SHARE;
  } catch {
    return false;
  }
}

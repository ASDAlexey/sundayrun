/**
 * One `<trkpt>` with its body: the two attributes GPX pins the point by, and whatever the recorder
 * hung inside it. Coros writes the attributes in this order and so does every other exporter — the
 * schema fixes them — but the body is free-form, so it is captured whole and read separately.
 */
export const GPX_POINT_PATTERN = /<trkpt lat="([\d.-]+)" lon="([\d.-]+)"[^>]*>([\S\s]*?)<\/trkpt>/g;

/** The sample's own timestamp, which is what turns a shape into a run. */
export const GPX_TIME_PATTERN = /<time>([^<]+)<\/time>/;

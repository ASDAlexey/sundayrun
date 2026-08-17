/**
 * Turns a GPX recording of the course into the SVG geometry the home page animates.
 *
 * The course schematic (`course-5k.webp`) is a picture — you cannot run a marker along a
 * raster. A GPS track of an actual lap gives the real shape, so the line the visitor watches
 * being drawn is the line they will actually run.
 *
 * Two paths come out of one track, because the run repeats itself and the drawing must not:
 *   - `COURSE_OUTLINE_PATH` — the course as a shape. One big lap plus the small lap; the
 *     second big lap is dropped because it retraces the first to within GPS noise, and a
 *     stroke-dash animation redrawing an existing line looks like a stall.
 *   - `COURSE_RUN_PATH` — the whole 5 km in running order, for `offset-path`. Here the
 *     repetition is the point: the marker genuinely goes round twice before the small lap.
 *
 * Nothing personal is read. Heart rate, cadence, timestamps and the recording date stay in
 * the GPX; only latitude and longitude reach the output, projected and normalised, so the
 * committed constant describes a park and not somebody's morning.
 *
 * Usage: bun scripts/build-course-track.ts <track.gpx>
 * The GPX itself is an input, not an artefact — keep it out of the repository.
 */
import { writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

/** A track point in WGS-84, carrying how far along the run it sits. */
interface TrackPoint {
  lat: number;
  lon: number;
  metersIn: number;
}

/** A point projected into the local metric plane, then into viewBox units. */
type Vec = [x: number, y: number];

const OUTPUT_PATH = 'src/app/features/home/course-track/course-geometry.constant.ts';

/** OpenStreetMap's footways for the park, fetched once with Overpass and committed. ODbL. */
const ALLEYS_INPUT_PATH = 'data/park-alleys.osm.json';

/** Greens and buildings around the course, same provenance and licence as the alleys. */
const AREAS_INPUT_PATH = 'data/park-areas.osm.json';

/** Named places in the park, same provenance and licence again. */
const LANDMARKS_INPUT_PATH = 'data/park-landmarks.osm.json';

/**
 * Which OSM categories belong on a park map. The bounding box also catches the pharmacies and
 * banks of the surrounding blocks; a runner orienting themselves needs the Ferris wheel and the
 * gazebo, not the nearest dentist.
 */
const LANDMARK_KINDS: Record<string, string> = {
  amusement_ride: 'ride',
  amusement_arcade: 'ride',
  carousel: 'ride',
  big_wheel: 'wheel',
  theme_park: 'ride',
  attraction: 'ride',
  zoo: 'zoo',
  memorial: 'monument',
  tomb: 'monument',
  artwork: 'monument',
  tree: 'tree',
  shelter: 'shelter',
  playground: 'playground',
  fitness_station: 'fitness',
  theatre: 'stage',
  museum: 'museum',
  fountain: 'fountain',
};

/**
 * Places that carry their name as well as their glyph.
 *
 * Everything in `LANDMARK_KINDS` gets an icon, but three dozen labels on a card this size is a
 * thicket. These are the ones that answer «where am I on the lap» — you pass the fountain every
 * time round, the eternal flame is the far corner — so they are worth the ink.
 */
const LABELLED_NAMES = ['Фонтан', 'Вечный Огонь', 'А. М. Горькому', 'Веревочный парк', 'Солнечные часы', 'Живой уголок'];

/**
 * Places whose name sits above the glyph instead of below it.
 *
 * Below is the default because it reads as a caption, but a few labels collide with the route or
 * with a neighbour down there. Which side a label takes is a decision about this particular map,
 * so it lives here rather than being derived from anything.
 */
const LABEL_ABOVE_NAMES = ['Вечный Огонь'];

/**
 * The base map goes out as its own file rather than into the component.
 *
 * Three hundred building outlines are some thirty kilobytes of path data, and the home page is
 * not lazy-loaded — inlining that would eat most of what is left of the bundle budget to draw
 * something that never changes and never animates. As a static asset it is cached, fetched
 * once, and costs the first render nothing.
 */
const BASEMAP_OUTPUT_PATH = 'public/course-basemap.svg';

/** Streets around the park, so the map has a town at its edges instead of a void. */
const STREETS_INPUT_PATH = 'data/park-streets.osm.json';

/**
 * Palette for the base map. Hard-coded, unlike everywhere else in the project, because an SVG
 * referenced through `<image>` is an isolated document: the page's custom properties do not
 * reach inside it.
 *
 * Light, against a dark site. A park map wants to look like a park — white alleys on green read
 * instantly, the same arrangement in dark grey on near-black does not — and an inset printed
 * map on a dark page is a familiar object rather than a clash. The club's own schematic was a
 * light map on this same dark card and never looked out of place.
 */
const BASEMAP_COLORS = {
  ground: '#f1eee7',
  green: '#d9ecc4',
  wood: '#cbe4b1',
  tree: '#a9cf8b',
  building: '#e6e0d6',
  buildingEdge: '#d6cec1',
  street: '#ffffff',
  streetEdge: '#e2dcd2',
};

/** Spacing of the scattered tree dots, in viewBox units — about one every fifteen metres. */
const TREE_STEP_UNITS = 30;

/** Buildings tolerate a coarser simplification than the route: they are texture, not geometry. */
const AREA_SIMPLIFY_TOLERANCE_M = 2.5;

/**
 * Trees are drawn, not surveyed.
 *
 * OpenStreetMap knows of four individual trees in this park; the commercial maps that show a
 * canopy sent someone to walk it. So the woodland polygons get a scatter of dots of our own
 * making — decoration derived from the shape of the wood, which is honest, rather than a copy
 * of anybody's survey. Seeded, so the file does not churn between runs.
 */
function scatterTrees(rings: Vec[][], seed: number): Vec[] {
  const random = seededRandom(seed);
  const trees: Vec[] = [];

  for (const ring of rings) {
    const xs = ring.map(([x]) => x);
    const ys = ring.map(([, y]) => y);

    for (let x = Math.min(...xs); x < Math.max(...xs); x += TREE_STEP_UNITS) {
      for (let y = Math.min(...ys); y < Math.max(...ys); y += TREE_STEP_UNITS) {
        const point: Vec = [x + (random() - 0.5) * TREE_STEP_UNITS, y + (random() - 0.5) * TREE_STEP_UNITS];

        if (isInside(point, ring)) {
          trees.push(point);
        }
      }
    }
  }

  return trees;
}

/** A small deterministic generator — the build must produce the same file every time. */
function seededRandom(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;

    return state / 4294967296;
  };
}

/** Ray casting: odd number of crossings to the right of the point means it is inside. */
function isInside([x, y]: Vec, ring: Vec[]): boolean {
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }

  return inside;
}

/** The streets around the park, as polylines in the same projection as everything else. */
async function readStreets(): Promise<{ lat: number; lon: number }[][]> {
  const raw = JSON.parse(await readFile(STREETS_INPUT_PATH, 'utf8')) as {
    elements?: { type?: string; geometry?: { lat: number; lon: number }[] }[];
  };

  return (raw.elements ?? [])
    .filter((e) => e.type === 'way')
    .map((way) => way.geometry ?? [])
    .filter((g) => g.length > 1);
}

/** How many direction arrows are spaced along one lap. */
const DIRECTION_ARROWS = 7;

/** How far a mark's label stands off the route, in viewBox units — roughly twenty metres. */
const MARK_LABEL_OFFSET = 62;

/**
 * An alley shorter than this is a spur: a path to a bench, a cut between two beds. They are
 * drawn thinner than the avenues so the park reads as a hierarchy instead of a net.
 */
const MAJOR_ALLEY_METERS = 90;

/** The viewBox is square-agnostic: the longer side gets this many units, the other less. */
const VIEW_SIZE = 1000;

/** Breathing room for the marker's own radius and the stroke width. */
const VIEW_PADDING = 14;

/**
 * The frame is widened to this ratio before anything is drawn.
 *
 * The course is very nearly square; the card it sits in is not. Fitted to its own bounds the map
 * letterboxed into pale bands down both sides, and captions on the western marks ran off the
 * edge. Padding the frame out sideways fills that space with the streets and houses that are
 * already in the extract — more town, rather than more nothing.
 */
const VIEW_ASPECT = 1.6;

/**
 * Ramer–Douglas–Peucker tolerance in metres. 1.5 m is below the width of the alleys and
 * well inside consumer-GPS noise, so the simplified line is not distinguishable from the
 * recording — but it drops roughly four points in five.
 */
const SIMPLIFY_TOLERANCE_M = 1.5;

/**
 * How far apart the two laps are drawn, in viewBox units (~0.5 m each).
 *
 * The laps are the same alleys twice, so plotted honestly they land on top of each other and
 * the map claims the course is one lap. The club's own schematic solves it by drawing the
 * route as parallel ribbons, and it is worth copying: the second lap beside the first is what
 * makes «два круга» a thing you see rather than a thing you read.
 */
const LAP_OFFSET_UNITS = 7;

/** A pass this close to the start counts as crossing it — the alleys are narrower than this. */
const LAP_PROXIMITY_M = 25;

/** Ignore the first stretch, or the start line would register as its own crossing. */
const LAP_MIN_METERS = 400;

/**
 * The distance the club declares and the protocol records. A recording of the route came to
 * 5018 m; the excess is receiver noise, not course, and kilometre marks are placed by this
 * number so that «1 км» sits a fifth of the way round rather than wherever a watch said.
 */
const DECLARED_TOTAL_METERS = 5000;

const EARTH_RADIUS_M = 6371008.8;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/** Great-circle distance; over a park it agrees with a tape measure. */
function metersBetween(a: TrackPoint, b: TrackPoint): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/** Every `<trkpt>` in order, each stamped with the distance covered up to it. */
function parseTrack(xml: string): TrackPoint[] {
  const points: TrackPoint[] = [];

  for (const match of xml.matchAll(/<trkpt lat="([-\d.]+)" lon="([-\d.]+)"/g)) {
    points.push({ lat: Number(match[1]), lon: Number(match[2]), metersIn: 0 });
  }

  if (points.length === 0) {
    throw new Error('no <trkpt> elements in the GPX');
  }

  for (let i = 1; i < points.length; i++) {
    points[i].metersIn = points[i - 1].metersIn + metersBetween(points[i - 1], points[i]);
  }

  return points;
}

/**
 * Where the run comes back past its own start. Two crossings mean two big laps; whatever
 * follows the last one is the small lap that tops the course up to 5 km.
 */
function lapCrossings(points: TrackPoint[]): number[] {
  const start = points[0];
  const crossings: number[] = [];
  let wasAway = false;

  for (const [index, point] of points.entries()) {
    if (point.metersIn < LAP_MIN_METERS) {
      continue;
    }

    const away = metersBetween(start, point) >= LAP_PROXIMITY_M;

    if (wasAway && !away) {
      crossings.push(points[closestApproach(points, index)].metersIn);
    }

    wasAway = away;
  }

  return crossings;
}

/**
 * The point of the pass that comes nearest the start, not the first one inside the threshold.
 *
 * Taking the threshold crossing cut each lap some twenty metres short, and since the ribbon is
 * drawn from that slice the loop came back visibly broken right beside the start pin — the one
 * place on the map everybody looks.
 */
function closestApproach(points: TrackPoint[], from: number): number {
  const start = points[0];
  let best = from;
  let bestDistance = metersBetween(start, points[from]);

  for (let i = from + 1; i < points.length; i++) {
    const distance = metersBetween(start, points[i]);

    if (distance > bestDistance + LAP_PROXIMITY_M) {
      break;
    }

    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  }

  return best;
}

/** Perpendicular distance from `p` to the segment `a`–`b`, in the projected plane. */
function segmentDistance(p: Vec, a: Vec, b: Vec): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.hypot(p[0] - a[0], p[1] - a[1]);
  }

  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSq));

  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Ramer–Douglas–Peucker, iterative so a 1400-point track cannot blow the stack. */
function simplify(points: Vec[], tolerance: number): Vec[] {
  if (points.length < 3) {
    return points;
  }

  const keep = new Array<boolean>(points.length).fill(false);
  const stack: [number, number][] = [[0, points.length - 1]];

  keep[0] = true;
  keep[points.length - 1] = true;

  while (stack.length > 0) {
    const [from, to] = stack.pop() as [number, number];
    let worst = 0;
    let worstAt = -1;

    for (let i = from + 1; i < to; i++) {
      const distance = segmentDistance(points[i], points[from], points[to]);

      if (distance > worst) {
        worst = distance;
        worstAt = i;
      }
    }

    if (worst > tolerance && worstAt !== -1) {
      keep[worstAt] = true;
      stack.push([from, worstAt], [worstAt, to]);
    }
  }

  return points.filter((_, i) => keep[i]);
}

/** Unit normal on the left of the segment `a`→`b`. */
function normalOf(a: Vec, b: Vec): Vec {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);

  if (length === 0) {
    return [0, 0];
  }

  return [-(b[1] - a[1]) / length, (b[0] - a[0]) / length];
}

/**
 * Shifts a polyline sideways by `distance`, so one lap can be drawn beside the other.
 *
 * Each vertex moves along the mitre between its two segment normals, lengthened by
 * `1 / cos(half-angle)` so the offset line stays a constant distance away through a corner.
 * The mitre is clamped: at a hairpin the exact factor runs to infinity and would fling a
 * single vertex across the park.
 */
function offsetPolyline(points: Vec[], distance: number): Vec[] {
  const MAX_MITRE = 2.5;

  return points.map((point, i) => {
    const before = i > 0 ? normalOf(points[i - 1], point) : null;
    const after = i < points.length - 1 ? normalOf(point, points[i + 1]) : null;
    const a = before ?? (after as Vec);
    const b = after ?? (before as Vec);
    const mitre: Vec = [a[0] + b[0], a[1] + b[1]];
    const length = Math.hypot(mitre[0], mitre[1]);

    if (length === 0) {
      return point;
    }

    const unit: Vec = [mitre[0] / length, mitre[1] / length];
    const scale = Math.min(MAX_MITRE, 1 / Math.max(0.4, unit[0] * a[0] + unit[1] * a[1]));

    return [point[0] + unit[0] * distance * scale, point[1] + unit[1] * distance * scale];
  });
}

/** `M…L…` with one decimal — a tenth of a viewBox unit is well under a rendered pixel. */
function toPathData(points: Vec[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('');
}

/**
 * Equirectangular projection about a local origin. Across half a kilometre the error against
 * a proper projection is millimetres, and it keeps the maths readable.
 */
function project(p: { lat: number; lon: number }, lat0: number, lon0: number): Vec {
  return [
    toRadians(p.lon - lon0) * EARTH_RADIUS_M * Math.cos(toRadians(lat0)),
    // Screen y grows downwards; north must not end up at the bottom.
    -toRadians(p.lat - lat0) * EARTH_RADIUS_M,
  ];
}

/**
 * The park's alley network, as fetched from OpenStreetMap and stored beside the script.
 *
 * Kept as a committed input rather than a build-time request: the build must not depend on a
 * public API being awake, and a licence-bearing dataset is easier to audit sitting in the
 * repository than arriving over the wire.
 */
async function readAlleys(): Promise<{ lat: number; lon: number }[][]> {
  const raw = JSON.parse(await readFile(ALLEYS_INPUT_PATH, 'utf8')) as {
    elements?: { geometry?: { lat: number; lon: number }[] }[];
  };

  return (raw.elements ?? []).map((way) => way.geometry ?? []).filter((geometry) => geometry.length > 1);
}

/**
 * Where a mark's label goes: outward, away from the middle of the course.
 *
 * Anchoring by frame edge kept labels inside the picture but not off the route — «1 круг» sat
 * squarely on the ribbon it was labelling. Pushing each one along the ray from the centre of
 * the loop puts every label on the outside of the track, which is where a race map puts them,
 * and picks the text alignment that follows from the direction it went.
 */
function outwardLabel(point: Vec, centre: Vec, distance: number): { lx: number; ly: number; anchor: string } {
  const dx = point[0] - centre[0];
  const dy = point[1] - centre[1];
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;

  return {
    lx: point[0] + ux * distance,
    ly: point[1] + uy * distance,
    anchor: ux > 0.25 ? 'start' : ux < -0.25 ? 'end' : 'middle',
  };
}

/** The average of a polyline's vertices — good enough as «the middle of the course». */
function centroid(points: Vec[]): Vec {
  const sum = points.reduce((acc, [x, y]) => [acc[0] + x, acc[1] + y] as Vec, [0, 0] as Vec);

  return [sum[0] / points.length, sum[1] / points.length];
}

/**
 * Which drawn glyph stands for a place. Named landmarks get a picture rather than a dot: on a
 * map this size a row of identical dots tells you there is something there but never what.
 */
function iconOf(name: string, kind: string): string {
  const byName: Record<string, string> = {
    'Вечный Огонь': 'flame',
    'Солнечные часы': 'sundial',
    'Детский фонтанчик': 'fountain',
  };

  return byName[name] ?? LANDMARK_KINDS[kind] ?? 'dot';
}

/** A named place, already projected into viewBox units. */
async function readLandmarks(): Promise<{ above: boolean; icon: string; labelled: boolean; lat: number; lon: number; name: string }[]> {
  const raw = JSON.parse(await readFile(LANDMARKS_INPUT_PATH, 'utf8')) as {
    elements?: { lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }[];
  };

  return (raw.elements ?? [])
    .map((node) => {
      const tags = node.tags ?? {};
      // The park's main fountain carries no name in OpenStreetMap, only its type. It is the
      // circle the small lap runs around, so it is worth naming even if the database will not.
      const name = tags['name'] ?? tags['description'] ?? (tags['amenity'] === 'fountain' ? 'Фонтан' : '');
      const kind =
        tags['attraction'] ??
        tags['tourism'] ??
        tags['leisure'] ??
        tags['amenity'] ??
        tags['historic'] ??
        tags['natural'] ??
        tags['man_made'] ??
        '';

      return {
        name,
        icon: iconOf(name, kind),
        labelled: LABELLED_NAMES.includes(name),
        above: LABEL_ABOVE_NAMES.includes(name),
        lat: node.lat ?? node.center?.lat ?? 0,
        lon: node.lon ?? node.center?.lon ?? 0,
        known: LANDMARK_KINDS[kind] !== undefined || byNameKnown(name),
      };
    })
    .filter((node) => node.known && node.name !== '')
    .map(({ known, ...node }) => node);
}

/** The two places whose glyph is chosen by name rather than by category. */
function byNameKnown(name: string): boolean {
  return name === 'Вечный Огонь' || name === 'Солнечные часы' || name === 'Детский фонтанчик';
}

/** One OSM way reduced to what the map needs: a closed ring and which layer it belongs to. */
interface AreaWay {
  layer: 'green' | 'wood' | 'building';
  ring: { lat: number; lon: number }[];
}

/** Greens and buildings, sorted into the three layers the base map draws. */
async function readAreas(): Promise<AreaWay[]> {
  const raw = JSON.parse(await readFile(AREAS_INPUT_PATH, 'utf8')) as {
    elements?: { geometry?: { lat: number; lon: number }[]; tags?: Record<string, string> }[];
  };

  return (raw.elements ?? [])
    .map((way) => ({ layer: layerOf(way.tags ?? {}), ring: way.geometry ?? [] }))
    .filter((way): way is AreaWay => way.layer !== null && way.ring.length > 2);
}

function layerOf(tags: Record<string, string>): AreaWay['layer'] | null {
  if (tags['building'] !== undefined) {
    return 'building';
  }

  if (tags['natural'] === 'wood' || tags['natural'] === 'scrub') {
    return 'wood';
  }

  if (tags['leisure'] !== undefined || tags['landuse'] !== undefined) {
    return 'green';
  }

  return null;
}

/** The point a given fraction along a polyline, measured the way `offset-distance` measures it. */
function pointAtFraction(points: Vec[], fraction: number): Vec {
  const lengths: number[] = [0];

  for (let i = 1; i < points.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  }

  const target = lengths[lengths.length - 1] * fraction;
  const at = lengths.findIndex((length) => length >= target);

  if (at <= 0) {
    return points[0];
  }

  const span = lengths[at] - lengths[at - 1];
  const t = span === 0 ? 0 : (target - lengths[at - 1]) / span;

  return [points[at - 1][0] + (points[at][0] - points[at - 1][0]) * t, points[at - 1][1] + (points[at][1] - points[at - 1][1]) * t];
}

/**
 * Arrowheads along the first lap, each turned to face the way the course is run.
 *
 * The club's schematic has always carried them, and they answer the one question a route drawing
 * cannot otherwise answer: which way round. Only the first lap gets them — the second is the same
 * loop, and doubling the arrows would only crowd it.
 */
function directionArrows(lap: Vec[]): { x: number; y: number; angle: number }[] {
  return Array.from({ length: DIRECTION_ARROWS }, (_, i) => {
    const fraction = (i + 0.5) / DIRECTION_ARROWS;
    const [x, y] = pointAtFraction(lap, fraction);
    const [ax, ay] = pointAtFraction(lap, Math.min(1, fraction + 0.01));

    return { x, y, angle: (Math.atan2(ay - y, ax - x) * 180) / Math.PI };
  });
}

/** Total length of a polyline in viewBox units. */
function polylineLength(points: Vec[]): number {
  let length = 0;

  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  }

  return length;
}

async function main(): Promise<void> {
  const source = process.argv[2];

  if (source === undefined) {
    throw new Error('usage: bun scripts/build-course-track.ts <track.gpx>');
  }

  const points = parseTrack(await readFile(source, 'utf8'));
  const totalMeters = points[points.length - 1].metersIn;
  const crossings = lapCrossings(points);

  if (crossings.length < 2) {
    throw new Error(`expected two laps past the start, found ${crossings.length} — is this a recording of the course?`);
  }

  const firstLapEnd = crossings[0];
  const lastCrossing = crossings[crossings.length - 1];

  const lat0 = (Math.min(...points.map((p) => p.lat)) + Math.max(...points.map((p) => p.lat))) / 2;
  const lon0 = (Math.min(...points.map((p) => p.lon)) + Math.max(...points.map((p) => p.lon))) / 2;
  const projected = points.map((p) => project(p, lat0, lon0));

  const xs = projected.map((p) => p[0]);
  const ys = projected.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const spanX = Math.max(...xs) - minX;
  const spanY = Math.max(...ys) - minY;
  const scale = (VIEW_SIZE - VIEW_PADDING * 2) / Math.max(spanX, spanY);
  const frameHeight = VIEW_PADDING * 2 + spanY * scale;
  const frameWidth = Math.max(VIEW_PADDING * 2 + spanX * scale, frameHeight * VIEW_ASPECT);
  const sideGutter = (frameWidth - (VIEW_PADDING * 2 + spanX * scale)) / 2;
  const toView = ([x, y]: Vec): Vec => [VIEW_PADDING + sideGutter + (x - minX) * scale, VIEW_PADDING + (y - minY) * scale];

  // The same projection, collapsed into the four numbers that reproduce it. Projection and framing
  // are both affine and both separable, so `toView(project(p))` is nothing more than a scale and a
  // shift per axis — which means a recording made on another day can be drawn in this frame without
  // shipping the maths or the recording that set the frame.
  const degreeMeters = EARTH_RADIUS_M * toRadians(1);
  const lonScale = degreeMeters * Math.cos(toRadians(lat0)) * scale;
  const latScale = -degreeMeters * scale;
  const geoFrame = {
    lonScale,
    lonOffset: VIEW_PADDING + sideGutter - minX * scale - lonScale * lon0,
    latScale,
    latOffset: VIEW_PADDING - minY * scale - latScale * lat0,
  };

  const view = projected.map(toView);
  const sliceBetween = (fromMeters: number, toMeters: number): Vec[] =>
    view.filter((_, i) => points[i].metersIn >= fromMeters && points[i].metersIn <= toMeters);

  // Closed explicitly: a lap is a loop, and the recording of it is not — it stops a stride or
  // two from where it began. Left open, the ribbon shows a notch at the start pin, which is
  // the one spot on the map everybody looks at.
  const openLap = simplify(sliceBetween(0, firstLapEnd), SIMPLIFY_TOLERANCE_M * scale);
  const bigLap = [...openLap, openLap[0]];
  const smallLap = simplify(sliceBetween(lastCrossing, totalMeters), SIMPLIFY_TOLERANCE_M * scale);

  // Two ribbons out of one recording. Both laps happen on the same alleys, so drawn where
  // they were actually run the second one hides under the first and the map quietly claims
  // the course is 2,3 km. Nudged apart they read as what they are: the same loop, twice.
  const lapOne = offsetPolyline(bigLap, -LAP_OFFSET_UNITS);
  const lapTwo = offsetPolyline(bigLap, LAP_OFFSET_UNITS);

  // The marker runs the ribbons end to end — outer lane, inner lane, then the small lap —
  // so switching lanes at the start line is something you watch it do.
  const run = [...lapOne, ...lapTwo, ...smallLap];
  const runLength = polylineLength(run);
  const start = view[0];
  const finish = view[view.length - 1];

  // The alleys ride the same projection as the track, so they line up with it by construction.
  // Anything wholly outside the track's frame is dropped: it would only widen the viewBox and
  // shrink the course to make room for streets nobody runs.
  const alleys = await readAlleys();
  const alleyTotal = alleys.length;
  const kept = alleys
    .map((way) =>
      simplify(
        way.map((p) => toView(project(p, lat0, lon0))),
        SIMPLIFY_TOLERANCE_M * scale,
      ),
    )
    .filter((way) => way.length > 1 && way.some(([x, y]) => x >= 0 && y >= 0 && x <= VIEW_SIZE && y <= VIEW_SIZE));
  const alleyPath = kept.map(toPathData).join('');
  const alleyWays = kept.length;
  const alleyPoints = kept.reduce((sum, way) => sum + way.length, 0);

  const viewWidth = frameWidth;
  const viewHeight = frameHeight;
  const landmarks = (await readLandmarks()).map((l) => {
    const [x, y] = toView(project(l, lat0, lon0));

    const edge = x > viewWidth * 0.8 ? 'end' : x < viewWidth * 0.2 ? 'start' : 'middle';

    return { name: l.name, x, y, icon: l.icon, labelled: l.labelled, above: l.above, anchor: edge };
  });

  const inFrame = landmarks.filter((l) => l.x > 0 && l.y > 0 && l.x < viewWidth && l.y < viewHeight);
  const angleAt = (points: Vec[], from: number, to: number): number => {
    const [ax, ay] = pointAtFraction(points, from);
    const [bx, by] = pointAtFraction(points, to);

    return (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
  };
  const startAngle = angleAt(lapOne, 0, 0.02);
  const finishAngle = angleAt(smallLap, 0.96, 1);
  const arrows = directionArrows(lapOne);
  const runCentre = centroid(run);
  const lapOneFraction = polylineLength(lapOne) / runLength;
  const lapTwoFraction = (polylineLength(lapOne) + polylineLength(lapTwo)) / runLength;

  // One lap mark, not two. Both laps end on the same line — that is what a lap is — so a second
  // balloon lands on top of the first and says nothing the first did not already say.
  const marks = [
    { km: '1', lap: 0, fraction: 1000 / DECLARED_TOTAL_METERS },
    { km: '2', lap: 0, fraction: 2000 / DECLARED_TOTAL_METERS },
    { km: '', lap: 1, fraction: lapOneFraction },
    { km: '3', lap: 0, fraction: 3000 / DECLARED_TOTAL_METERS },
    { km: '4', lap: 0, fraction: 4000 / DECLARED_TOTAL_METERS },
  ]
    .map(({ km, lap, fraction }) => {
      const point = pointAtFraction(run, fraction);

      return { km, lap, x: point[0], y: point[1], ...outwardLabel(point, runCentre, MARK_LABEL_OFFSET) };
    })
    .sort((a, b) => a.x - b.x);

  const file = `// Generated by scripts/build-course-track.ts from a GPS recording of the course.
// Do not edit by hand — re-run the script instead.

/** Fits the projected track with room for the marker's radius at the extremes. */
export const COURSE_VIEW_BOX = '0 0 ${frameWidth.toFixed(1)} ${frameHeight.toFixed(1)}';

/**
 * How WGS-84 degrees become viewBox units in this frame: \`x = lon × lonScale + lonOffset\`,
 * \`y = lat × latScale + latOffset\`.
 *
 * The frame was fitted to one recording, and without these numbers it is a picture only that
 * recording can be drawn in. With them, any GPX of the course lands on the same alleys — which is
 * what lets an athlete's own track from their own watch be drawn over this map.
 *
 * Full precision on purpose: the offsets are millions of units and rounding them to a few decimals
 * would walk the whole map off the park. Nothing personal here — it is the projection of a park,
 * not of anybody's morning.
 */
export const COURSE_GEO_FRAME = {
  lonScale: ${geoFrame.lonScale},
  lonOffset: ${geoFrame.lonOffset},
  latScale: ${geoFrame.latScale},
  latOffset: ${geoFrame.latOffset},
};

/** The first big lap, nudged to one side of the alleys it was run on. */
export const COURSE_LAP_ONE_PATH =
  '${toPathData(lapOne)}';

/** The second big lap, nudged to the other side, so «два круга» is visible rather than stated. */
export const COURSE_LAP_TWO_PATH =
  '${toPathData(lapTwo)}';

/** The short lap that tops the course up to 5 km — run once, so drawn once. */
export const COURSE_FINAL_LAP_PATH =
  '${toPathData(smallLap)}';

/** All three ribbons end to end as one subpath, for the marker's \`offset-path\`. */
export const COURSE_RUN_PATH =
  '${toPathData(run)}';

/** Where the start and the finish sit — a few strides apart, as on the club's own schematic. */
export const COURSE_START_POINT = { x: ${start[0].toFixed(1)}, y: ${start[1].toFixed(1)} };

export const COURSE_FINISH_POINT = { x: ${finish[0].toFixed(1)}, y: ${finish[1].toFixed(1)} };

/**
 * Which way the course runs through the start and the finish, so their lines can be drawn across
 * it. A start line that ignores the direction of travel is a rectangle lying on a map; turned to
 * face the runners it is a start line.
 */
export const COURSE_START_ANGLE = ${startAngle.toFixed(1)};

export const COURSE_FINISH_ANGLE = ${finishAngle.toFixed(1)};

/**
 * Where each lap ends as a fraction of the marker's journey. Timing only — the distances the
 * visitor reads are the course's declared ones, not what a GPS watch happened to measure.
 */
export const COURSE_LAP_ONE_END_FRACTION = ${lapOneFraction.toFixed(4)};

export const COURSE_LAP_TWO_END_FRACTION = ${lapTwoFraction.toFixed(4)};

/**
 * The park's own alleys, faint underneath the route — the context that makes the course a
 * place rather than a squiggle. One \`d\` with many subpaths: 120-odd separate elements would
 * cost more in DOM than the geometry costs in bytes.
 *
 * © OpenStreetMap contributors, ODbL. The attribution in the UI is a licence term, not a
 * courtesy — do not remove it.
 */
export const COURSE_ALLEY_PATH =
  '${alleyPath}';

/**
 * Named places, for the labels that tell a stranger where in the park they are.
 *
 * Kilometre marks below are placed by the declared distance — a fifth of the way round is 1 km
 * whatever a GPS receiver made of it. The lap marks are placed by geometry instead, because
 * they must land on the start line itself; the declared 2300 m falls some fifty metres past it.
 */
export const COURSE_LANDMARKS = [
${inFrame.map((l) => `  { name: '${l.name.replace(/'/g, "\\'")}', icon: '${l.icon}', labelled: ${l.labelled}, above: ${l.above}, anchor: '${l.anchor}', x: ${l.x.toFixed(1)}, y: ${l.y.toFixed(1)} },`).join('\n')}
];

/**
 * The marks a runner counts off: each kilometre, and the two lap boundaries where a volunteer
 * stands with a stopwatch.
 */
/** Arrowheads showing which way the course is run, spaced along the first lap. */
export const COURSE_ARROWS = [
${arrows.map((a) => `  { x: ${a.x.toFixed(1)}, y: ${a.y.toFixed(1)}, angle: ${a.angle.toFixed(1)} },`).join('\n')}
];

export const COURSE_MARKS = [
${marks.map((m) => `  { km: '${m.km}', lap: ${m.lap}, x: ${m.x.toFixed(1)}, y: ${m.y.toFixed(1)}, lx: ${m.lx.toFixed(1)}, ly: ${m.ly.toFixed(1)}, anchor: '${m.anchor}' },`).join('\n')}
];
`;

  // Greens first, buildings on top: a house standing in the park should read as standing in it.
  const areas = await readAreas();
  const layers = (['green', 'wood', 'building'] as const).map((layer) => ({
    layer,
    rings: areas
      .filter((way) => way.layer === layer)
      .map((way) =>
        simplify(
          way.ring.map((p) => toView(project(p, lat0, lon0))),
          AREA_SIMPLIFY_TOLERANCE_M * scale,
        ),
      )
      .filter(
        (ring) => ring.length > 2 && ring.some(([x, y]) => x > -VIEW_SIZE && y > -VIEW_SIZE && x < VIEW_SIZE * 2 && y < VIEW_SIZE * 2),
      ),
  }));

  const streets = (await readStreets()).map((way) =>
    simplify(
      way.map((p) => toView(project(p, lat0, lon0))),
      AREA_SIMPLIFY_TOLERANCE_M * scale,
    ),
  );
  const woodRings = layers.filter((l) => l.layer !== 'building').flatMap((l) => l.rings);
  const trees = scatterTrees(woodRings, 20260726);
  const ring = (rings: Vec[][]): string => rings.map((r) => `${toPathData(r)}Z`).join('');
  const fill = (rings: Vec[][], colour: string, edge?: string): string =>
    `<path fill="${colour}"${edge === undefined ? '' : ` stroke="${edge}" stroke-width="0.8"`} d="${ring(rings)}"/>`;

  // Drawn in the order a paper map is printed: ground, greens, wood, canopy, streets, houses.
  const basemap = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewWidth.toFixed(1)} ${viewHeight.toFixed(1)}">
<!-- Generated by scripts/build-course-track.ts. Map data © OpenStreetMap contributors, ODbL.
The tree canopy is drawn from the woodland outlines, not surveyed. -->
<rect width="100%" height="100%" fill="${BASEMAP_COLORS.ground}"/>
${fill(layers.find((l) => l.layer === 'green')?.rings ?? [], BASEMAP_COLORS.green)}
${fill(layers.find((l) => l.layer === 'wood')?.rings ?? [], BASEMAP_COLORS.wood)}
<g fill="${BASEMAP_COLORS.tree}">${trees.map(([x, y]) => `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="7"/>`).join('')}</g>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">
<path stroke="${BASEMAP_COLORS.streetEdge}" stroke-width="13" d="${streets.map(toPathData).join('')}"/>
<path stroke="${BASEMAP_COLORS.street}" stroke-width="10" d="${streets.map(toPathData).join('')}"/>
</g>
${fill(layers.find((l) => l.layer === 'building')?.rings ?? [], BASEMAP_COLORS.building, BASEMAP_COLORS.buildingEdge)}
</svg>
`;

  writeFileSync(OUTPUT_PATH, file);
  writeFileSync(BASEMAP_OUTPUT_PATH, basemap);

  console.log(
    [
      `track:      ${points.length} points, ${Math.round(totalMeters)} m`,
      `laps:       big ${Math.round(firstLapEnd)} m ×${crossings.length}, small ${Math.round(totalMeters - lastCrossing)} m`,
      `ribbons:    lap ${lapOne.length} pts ×2 offset ${LAP_OFFSET_UNITS} units, small lap ${smallLap.length} pts`,
      `run path:   ${run.length} pts, laps end at ${lapOneFraction.toFixed(3)} / ${lapTwoFraction.toFixed(3)}`,
      `marks:      ${marks.length}`,
      `alleys:     ${alleyWays} ways kept of ${alleyTotal}, ${alleyPoints} points`,
      `areas:      ${layers.map((l) => `${l.layer} ${l.rings.length}`).join(', ')}, streets ${streets.length}, trees ${trees.length}`,
      `landmarks:  ${inFrame.map((l) => l.name).join(', ')}`,
      `written:    ${OUTPUT_PATH} (${(Buffer.byteLength(file) / 1024).toFixed(1)} KB)`,
      `written:    ${BASEMAP_OUTPUT_PATH} (${(Buffer.byteLength(basemap) / 1024).toFixed(1)} KB)`,
    ].join('\n'),
  );
}

await main();

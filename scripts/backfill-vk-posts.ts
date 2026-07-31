/**
 * Photo-link backfill for the local `data/sundayrun.db`: creates `event_vk_post` (v6 → v7) and
 * matches every event to the community's wall post carrying that race's photographs.
 *
 * The club posts one entry per race — «Воскресный Контрольный парковый пробег № 2.72 от 22 февраля
 * 2026 г.» — with the protocol scan and the photos attached, so the post text alone identifies the
 * race twice over: by the organisers' number (`events.legacy_number`) and by the date. Both are
 * read; when both resolve and disagree, the post is left unmatched rather than guessed at. Posts
 * without a photo attachment are skipped — there would be nothing to link to.
 *
 * Only the link is stored. The photographs stay on VK: their CDN urls are signed and expire, and
 * the images are the photographers', not ours.
 *
 * Idempotent: an event that already has a link keeps it unless `--force` is passed.
 *
 * Run: VK_TOKEN=<service key> bun scripts/backfill-vk-posts.ts [--dry-run] [--force]
 * The token is a community-app *service key* from dev.vk.com — `wall.get` on a public wall needs
 * nothing more, and it grants no access to your own account.
 */
import { Database } from 'bun:sqlite';

import { ISO_DATE_LENGTH } from '../src/app/core/history/notables.constant';
import {
  PROTOCOL_DB_META_SCHEMA_VERSION_KEY,
  PROTOCOL_DB_SCHEMA_VERSION,
  PROTOCOL_DB_V7_MIGRATION_STATEMENTS,
  PROTOCOL_DB_V8_MIGRATION_STATEMENTS,
} from '../src/app/core/sqlite/protocol-db-schema.constant';
import { parseDateFromFileName } from '../src/app/core/time/file-name-date';
import { isProtocolScan } from './protocol-scan';

/** The club's community: `vk.com/parkgorkogoruntgn`. Wall owner ids are negative for communities. */
const VK_GROUP_ID = 141369129;

const VK_OWNER_ID = -VK_GROUP_ID;

const VK_API_URL = 'https://api.vk.com/method/wall.get';

const VK_API_VERSION = '5.199';

/** `wall.get` caps a page at 100 items. */
const VK_PAGE_SIZE = 100;

/** Stays well inside the 3 requests/second the service key is rated for. */
const VK_REQUEST_PAUSE_MS = 350;

/** A runaway guard: 100 pages is ten thousand posts, far more than the wall holds. */
const VK_MAX_PAGES = 100;

const MS_PER_SECOND = 1000;

/** Posts run newest-first, so the walk stops once it is a season past the oldest race. */
const WALK_STOP_MARGIN_DAYS = 180;

const SECONDS_PER_DAY = 86_400;

/** '№ 2.72' / '№ 174' — the organisers' own numbering, as stored in `events.legacy_number`. */
const POST_NUMBER_PATTERN = /№\s*(\d+(?:\.\d+)?)/u;

/** The photo-ish attachment types; an `album` link is as good as loose photos for our purposes. */
const PHOTO_ATTACHMENT_TYPES = new Set(['photo', 'album']);

/** How many photographs of a post are stored — the strip shows six, the viewer pages through these. */
const MAX_PHOTOS_PER_EVENT = 12;

/** The strip renders 160 px squares; 320 covers a 2× screen without pulling a full-size image. */
const PREVIEW_MIN_WIDTH = 320;

/** The viewer's ceiling: bigger renditions are a multi-megabyte download for no visible gain. */
const LARGE_MAX_WIDTH = 1600;

/** One rendition VK offers of a photo; `type` is its letter code, ordered by `width` in code. */
interface VkPhotoSize {
  url: string;
  width: number;
  height: number;
}

interface VkPhoto {
  id: number;
  owner_id: number;
  sizes: VkPhotoSize[];
}

interface VkAttachment {
  type: string;
  photo?: VkPhoto;
}

interface VkPost {
  id: number;
  date: number;
  text: string;
  attachments?: VkAttachment[];
  /** Present on reposts — the text belongs to somebody else's post, so those are skipped. */
  copy_history?: unknown[];
}

interface VkWallResponse {
  response?: { count: number; items: VkPost[] };
  error?: { error_code: number; error_msg: string };
}

/** One archive event, keyed the two ways a post can name it. */
interface EventRow {
  slug: string;
  dateIso: string;
  legacyNumber: string | null;
}

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');
const envToken = process.env['VK_TOKEN'];

if (!envToken) {
  console.error('VK_TOKEN is not set. Pass a dev.vk.com service key: VK_TOKEN=<key> bun scripts/backfill-vk-posts.ts');
  process.exit(1);
}

const token: string = envToken;

const db = new Database('data/sundayrun.db');

for (const statement of [...PROTOCOL_DB_V7_MIGRATION_STATEMENTS, ...PROTOCOL_DB_V8_MIGRATION_STATEMENTS]) {
  db.exec(statement);
}

const events = db.query('SELECT slug, date_iso AS dateIso, legacy_number AS legacyNumber FROM events').all() as EventRow[];
const linked = new Set((db.query('SELECT slug FROM event_vk_post').all() as { slug: string }[]).map((row) => row.slug));
/** Races whose strip is already stored: a run that only adds photos must not skip them as «linked». */
const photographed = new Set((db.query('SELECT DISTINCT slug FROM event_photo').all() as { slug: string }[]).map((row) => row.slug));

if (events.length === 0) {
  console.error('No events in data/sundayrun.db — nothing to match.');
  process.exit(1);
}

const eventsByDate = new Map(events.map((event) => [event.dateIso, event]));
const eventsByNumber = new Map(events.flatMap((event) => (event.legacyNumber === null ? [] : [[event.legacyNumber, event] as const])));
const oldestDateIso = events.reduce((oldest, event) => (event.dateIso < oldest ? event.dateIso : oldest), events[0].dateIso);
const walkStopSeconds = Math.floor(Date.parse(`${oldestDateIso}T00:00:00Z`) / MS_PER_SECOND) - WALK_STOP_MARGIN_DAYS * SECONDS_PER_DAY;

/** One `wall.get` page; a VK-level error is fatal — a partial walk would silently under-match. */
async function fetchWallPage(offset: number): Promise<VkPost[]> {
  const url = new URL(VK_API_URL);

  url.searchParams.set('owner_id', String(VK_OWNER_ID));
  url.searchParams.set('count', String(VK_PAGE_SIZE));
  url.searchParams.set('offset', String(offset));
  url.searchParams.set('v', VK_API_VERSION);
  url.searchParams.set('access_token', token);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`VK API responded ${response.status} ${response.statusText}`);
  }

  const body = (await response.json()) as VkWallResponse;

  if (body.error) {
    throw new Error(`VK API error ${body.error.error_code}: ${body.error.error_msg}`);
  }

  return body.response?.items ?? [];
}

/** The publication day of a post as 'YYYY-MM-DD' — the reference year for a yearless date in its text. */
function postDateIso(post: VkPost): string {
  return new Date(post.date * MS_PER_SECOND).toISOString().slice(0, ISO_DATE_LENGTH);
}

/** True when the post carries photographs of its own — a bare text announcement links to nothing. */
function hasPhotos(post: VkPost): boolean {
  return (post.attachments ?? []).some((attachment) => PHOTO_ATTACHMENT_TYPES.has(attachment.type));
}

/** One stored photograph: the two CDN renditions the page uses, plus its permanent VK page. */
interface PhotoRow {
  previewUrl: string;
  largeUrl: string;
  photoUrl: string;
}

/**
 * The post's photographs in attachment order, capped at `MAX_PHOTOS_PER_EVENT`. VK's size letters
 * have changed over the years, so the renditions are picked by pixel width rather than by code:
 * the smallest one that still fills a retina thumbnail, and the largest one under the viewer's
 * ceiling. A photo VK returned without any sizes is dropped — there would be nothing to render.
 */
function photoRows(post: VkPost): PhotoRow[] {
  const rows: PhotoRow[] = [];

  for (const attachment of post.attachments ?? []) {
    const photo = attachment.photo;

    if (attachment.type !== 'photo' || !photo || photo.sizes.length === 0) {
      continue;
    }

    const ascending = [...photo.sizes].sort((left, right) => left.width - right.width);
    const largest = ascending[ascending.length - 1];
    const preview = ascending.find((size) => size.width >= PREVIEW_MIN_WIDTH) ?? largest;
    const large = [...ascending].reverse().find((size) => size.width <= LARGE_MAX_WIDTH) ?? ascending[0];

    rows.push({
      previewUrl: preview.url,
      largeUrl: large.url,
      photoUrl: `https://vk.com/photo${photo.owner_id}_${photo.id}`,
    });

    if (rows.length === MAX_PHOTOS_PER_EVENT) {
      break;
    }
  }

  return rows;
}

/**
 * A photo report is published on race day or after it. The announcement of an upcoming race names
 * the same date and often carries a poster, which would otherwise pass for photographs of a race
 * that had not been run yet.
 */
function isReport(post: VkPost, event: EventRow): boolean {
  return post.date >= Math.floor(Date.parse(`${event.dateIso}T00:00:00Z`) / MS_PER_SECOND);
}

/**
 * The event a post is about, or null. The date and the organisers' number are independent keys:
 * either alone identifies the race, and a disagreement between them means the text was misread —
 * a photo report of one race that mentions another's number — so the post is dropped.
 */
function matchEvent(post: VkPost): EventRow | null {
  const numberMatch = POST_NUMBER_PATTERN.exec(post.text);
  const byNumber = numberMatch === null ? undefined : eventsByNumber.get(numberMatch[1]);
  // A yearless «29 марта» is resolved against the day the post went up, not against today: the
  // parser's file-name default would date a 2021 report to the current season.
  const dateIso = parseDateFromFileName(post.text, postDateIso(post));
  const byDate = dateIso === null ? undefined : eventsByDate.get(dateIso);

  if (byNumber && byDate && byNumber.slug !== byDate.slug) {
    console.log(`  wall_${post.id}: № ${numberMatch?.[1]} и дата ${dateIso} указывают на разные забеги, пропуск`);

    return null;
  }

  return byNumber ?? byDate ?? null;
}

/** The post chosen for a race: its id for the link, its photographs for the strip. */
interface MatchedPost {
  postId: number;
  photos: PhotoRow[];
}

const matched = new Map<string, MatchedPost>();
let scanned = 0;
let skippedNoPhotos = 0;
let skippedAnnouncements = 0;

for (let page = 0; page < VK_MAX_PAGES; page += 1) {
  const items = await fetchWallPage(page * VK_PAGE_SIZE);

  if (items.length === 0) {
    break;
  }

  for (const post of items) {
    scanned += 1;

    if (post.copy_history) {
      continue;
    }

    const event = matchEvent(post);

    if (event === null) {
      continue;
    }

    if (!isReport(post, event)) {
      skippedAnnouncements += 1;
      continue;
    }

    if (!hasPhotos(post)) {
      skippedNoPhotos += 1;
      continue;
    }

    // Newest-first, so the first post matching a race is its freshest photo report.
    if (!matched.has(event.slug)) {
      matched.set(event.slug, { postId: post.id, photos: photoRows(post) });
    }
  }

  console.log(`Страница ${page + 1}: ${items.length} постов, найдено забегов ${matched.size} из ${events.length}`);

  if (items.length < VK_PAGE_SIZE || items[items.length - 1].date < walkStopSeconds) {
    break;
  }

  await Bun.sleep(VK_REQUEST_PAUSE_MS);
}

const upsert = db.query('INSERT INTO event_vk_post (slug, post_url) VALUES (?1, ?2) ON CONFLICT(slug) DO UPDATE SET post_url = ?2');
// The strip is rewritten wholesale per race: VK re-signs its urls, and a partial upsert would
// leave a race holding a mix of fresh and rotted ones.
const clearPhotos = db.query('DELETE FROM event_photo WHERE slug = ?1');
const insertPhoto = db.query('INSERT INTO event_photo (slug, idx, preview_url, large_url, photo_url) VALUES (?1, ?2, ?3, ?4, ?5)');
let written = 0;
let kept = 0;
let photosWritten = 0;
let scansDropped = 0;

for (const [slug, { postId, photos }] of [...matched].sort(([left], [right]) => left.localeCompare(right))) {
  const postUrl = `https://vk.com/wall${VK_OWNER_ID}_${postId}`;

  // Nothing left to add once both the link and the strip are stored; a post that carries no
  // photographs at all is complete with the link alone.
  if (linked.has(slug) && (photographed.has(slug) || photos.length === 0) && !force) {
    kept += 1;
    continue;
  }

  // The signed protocol sheet is attached alongside the pictures — and not always first — so each
  // thumbnail is looked at rather than counted; see `protocol-scan`.
  const pictures: PhotoRow[] = [];

  for (const photo of photos) {
    if (await isProtocolScan(photo.previewUrl)) {
      scansDropped += 1;
      continue;
    }

    pictures.push(photo);
  }

  if (!dryRun) {
    upsert.run(slug, postUrl);
    clearPhotos.run(slug);

    for (const [index, photo] of pictures.entries()) {
      insertPhoto.run(slug, index, photo.previewUrl, photo.largeUrl, photo.photoUrl);
    }
  }

  written += 1;
  photosWritten += pictures.length;

  console.log(`  ${slug} → ${postUrl} (фото: ${pictures.length})`);
}

if (!dryRun) {
  db.query('INSERT INTO meta VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2').run(
    PROTOCOL_DB_META_SCHEMA_VERSION_KEY,
    PROTOCOL_DB_SCHEMA_VERSION,
  );
  db.exec('VACUUM');
}

db.close();

const unmatched = events.length - matched.size;

console.log(
  `Просмотрено постов: ${scanned}. Сопоставлено забегов: ${matched.size} из ${events.length}` +
    ` (без поста: ${unmatched}, найдены без фото: ${skippedNoPhotos}, анонсов до забега: ${skippedAnnouncements}).` +
    ` Фотографий: ${photosWritten}, отсеяно сканов протокола: ${scansDropped}.` +
    ` ${dryRun ? 'Dry-run: в базу ничего не записано' : `Записано: ${written}, оставлено как было: ${kept}`}.`,
);

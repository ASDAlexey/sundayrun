/**
 * Drops the photographed protocol sheets from an already-filled `event_photo`.
 *
 * `scripts/backfill-vk-posts.ts` now recognises a scan while it writes, but the strips collected
 * before it did still carry them. This walks the stored thumbnails, measures each one (see
 * `protocol-scan`) and deletes the sheets — no VK token needed, the CDN urls are public.
 *
 * Idempotent: a second run finds nothing left to drop. Row indices keep their gaps, since the strip
 * only ever reads them in order.
 *
 * Run: bun scripts/prune-protocol-scans.ts [--dry-run]
 */
import { Database } from 'bun:sqlite';

import { isProtocolScan } from './protocol-scan';

/** Thumbnails checked at once — polite to the CDN, still finishes six hundred in a minute. */
const CONCURRENCY = 8;

interface PhotoRow {
  slug: string;
  idx: number;
  previewUrl: string;
}

const dryRun = process.argv.includes('--dry-run');
const db = new Database('data/sundayrun.db');
const photos = db.query('SELECT slug, idx, preview_url AS previewUrl FROM event_photo ORDER BY slug, idx').all() as PhotoRow[];

if (photos.length === 0) {
  console.error('event_photo пуста — сначала прогоните scripts/backfill-vk-posts.ts');
  process.exit(1);
}

const scans: PhotoRow[] = [];

for (let start = 0; start < photos.length; start += CONCURRENCY) {
  const batch = photos.slice(start, start + CONCURRENCY);
  const verdicts = await Promise.all(batch.map((photo) => isProtocolScan(photo.previewUrl)));

  for (const [index, isScan] of verdicts.entries()) {
    if (isScan) {
      scans.push(batch[index]);
    }
  }

  console.log(`Проверено ${Math.min(start + CONCURRENCY, photos.length)} из ${photos.length}, найдено сканов: ${scans.length}`);
}

const remove = db.query('DELETE FROM event_photo WHERE slug = ?1 AND idx = ?2');

for (const scan of scans) {
  console.log(`  ${scan.slug} #${scan.idx} — скан протокола`);

  if (!dryRun) {
    remove.run(scan.slug, scan.idx);
  }
}

if (!dryRun && scans.length > 0) {
  db.exec('VACUUM');
}

const emptied = db
  .query('SELECT COUNT(*) c FROM event_vk_post p WHERE NOT EXISTS (SELECT 1 FROM event_photo f WHERE f.slug = p.slug)')
  .get() as {
  c: number;
};

db.close();

console.log(
  `Просмотрено фотографий: ${photos.length}. Сканов протокола: ${scans.length}.` +
    ` Забегов, оставшихся совсем без фото: ${emptied.c} (у них останется только ссылка на пост).` +
    ` ${dryRun ? 'Dry-run: ничего не удалено' : 'Удалено'}.`,
);

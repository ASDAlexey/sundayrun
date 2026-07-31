import { asc, eq } from 'drizzle-orm';

import { EventPhoto } from '../core/models/event-photo.interface';
import { eventPhoto, eventVkPost } from '../core/sqlite/protocol-db.schema';
import { ProtocolDrizzle } from '../core/sqlite/protocol-drizzle';

/** The `event_vk_post` / `event_photo` reads, split out of `protocol-db-queries.ts` the way the weather selects are. */

/**
 * The community's wall post holding the event's photographs; null when no post was matched to the
 * event — most of the early archive, and any event whose photos were never published.
 */
export async function selectEventVkPostUrl(db: ProtocolDrizzle, slug: string): Promise<string | null> {
  const [row] = await db.select({ postUrl: eventVkPost.postUrl }).from(eventVkPost).where(eq(eventVkPost.slug, slug));

  return row?.postUrl ?? null;
}

/** The event's photographs in the order the post attached them; empty when none were matched. */
export function selectEventPhotos(db: ProtocolDrizzle, slug: string): Promise<EventPhoto[]> {
  return db
    .select({ previewUrl: eventPhoto.previewUrl, largeUrl: eventPhoto.largeUrl, photoUrl: eventPhoto.photoUrl })
    .from(eventPhoto)
    .where(eq(eventPhoto.slug, slug))
    .orderBy(asc(eventPhoto.idx));
}

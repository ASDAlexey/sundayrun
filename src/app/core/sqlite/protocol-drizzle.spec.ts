import { eq } from 'drizzle-orm';

import { events } from './protocol-db.schema';
import { createProtocolDrizzle } from './protocol-drizzle';
import { createMemoryProtocolDb } from './spec-utils/protocol-db-memory';

describe('createProtocolDrizzle', () => {
  let close: (() => void) | null = null;

  afterEach(() => {
    close?.();
    close = null;
  });

  it('maps positional value arrays to typed rows and takes the first row for a `get`', async () => {
    const memory = await createMemoryProtocolDb([
      "INSERT INTO events VALUES ('2026-06-21', '2026-06-21', 12, NULL, 'Москва', 'Парк', 'Клуб', 'Иванов', 3, 3, 100, 90, 95, NULL, NULL)",
    ]);

    close = memory.close;

    const db = createProtocolDrizzle(memory.db);

    await expect(db.select({ slug: events.slug }).from(events), 'an `all` returns every row').resolves.toEqual([{ slug: '2026-06-21' }]);
    await expect(
      db.select({ slug: events.slug }).from(events).where(eq(events.slug, '2026-06-21')).get(),
      'a `get` unwraps the single row',
    ).resolves.toEqual({ slug: '2026-06-21' });
    await expect(
      db.select({ slug: events.slug }).from(events).where(eq(events.slug, 'нет')).get(),
      'a `get` with no rows falls back to an empty tuple, so the mapped field is undefined',
    ).resolves.toEqual({ slug: undefined });
  });
});

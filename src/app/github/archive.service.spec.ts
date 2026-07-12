import { TestBed } from '@angular/core/testing';

import { ARCHIVE_INDEX_SCHEMA_VERSION } from '../core/github/archive-index.constant';
import { ProtocolDb } from '../core/sqlite/protocol-db.interface';
import { createMemoryProtocolDb } from '../core/sqlite/spec-utils/protocol-db-memory';
import { ArchiveService } from './archive.service';
import { EXPECTED_ARCHIVE_EVENTS, LATEST_EVENTS_LIMIT, SEED_EVENTS } from './protocol-db-queries.mock';
import { PROTOCOL_DB_ERROR_MESSAGE } from './protocol-db.service.mock';
import { PROTOCOL_DB } from './protocol-db.token';

describe('ArchiveService', () => {
  let close: (() => void) | null = null;

  afterEach(() => {
    close?.();
    close = null;
  });

  async function serviceOver(db: ProtocolDb): Promise<ArchiveService> {
    TestBed.configureTestingModule({ providers: [{ provide: PROTOCOL_DB, useValue: db }] });

    return TestBed.inject(ArchiveService);
  }

  it('serves the full index and the latest slice from sundayrun.db', async () => {
    const memory = await createMemoryProtocolDb(SEED_EVENTS);

    close = memory.close;

    const service = await serviceOver(memory.db);

    await expect(service.loadIndex()).resolves.toEqual({ schemaVersion: ARCHIVE_INDEX_SCHEMA_VERSION, events: EXPECTED_ARCHIVE_EVENTS });
    await expect(service.loadLatest(LATEST_EVENTS_LIMIT)).resolves.toEqual(EXPECTED_ARCHIVE_EVENTS.slice(0, LATEST_EVENTS_LIMIT));
  });

  it('propagates a db failure so the page can show a distinct error state', async () => {
    const service = await serviceOver({ queryValues: () => Promise.reject(new Error(PROTOCOL_DB_ERROR_MESSAGE)) });

    await expect(service.loadIndex()).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
    await expect(service.loadLatest(LATEST_EVENTS_LIMIT)).rejects.toMatchObject({ cause: { message: PROTOCOL_DB_ERROR_MESSAGE } });
  });
});

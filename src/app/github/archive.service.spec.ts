import { TestBed } from '@angular/core/testing';

import { EXISTING_INDEX } from '../core/github/archive-index.mock';
import { ArchiveService } from './archive.service';
import { EVENT_SQL_ROWS, LATEST_EVENTS_LIMIT } from './protocol-db-queries.mock';
import { PROTOCOL_DB_ERROR_MESSAGE } from './protocol-db.service.mock';
import { PROTOCOL_DB } from './protocol-db.token';

describe('ArchiveService', () => {
  const dbQuery = vi.fn();

  let service: ArchiveService;

  beforeEach(() => {
    dbQuery.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: PROTOCOL_DB, useValue: { query: dbQuery } }],
    });
    service = TestBed.inject(ArchiveService);
  });

  it('serves the full index and the latest slice from protocol.db', async () => {
    dbQuery.mockResolvedValueOnce(EVENT_SQL_ROWS);

    await expect(service.loadIndex()).resolves.toEqual(EXISTING_INDEX);

    dbQuery.mockResolvedValueOnce(EVENT_SQL_ROWS.slice(0, LATEST_EVENTS_LIMIT));

    await expect(service.loadLatest(LATEST_EVENTS_LIMIT)).resolves.toEqual(EXISTING_INDEX.events.slice(0, LATEST_EVENTS_LIMIT));
  });

  it('propagates a db failure so the page can show a distinct error state', async () => {
    dbQuery.mockRejectedValue(new Error(PROTOCOL_DB_ERROR_MESSAGE));

    await expect(service.loadIndex()).rejects.toThrow(PROTOCOL_DB_ERROR_MESSAGE);
    await expect(service.loadLatest(LATEST_EVENTS_LIMIT)).rejects.toThrow(PROTOCOL_DB_ERROR_MESSAGE);
  });
});

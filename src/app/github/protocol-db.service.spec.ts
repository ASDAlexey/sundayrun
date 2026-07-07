import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SERVER_PLATFORM_ID } from '../features/spec-utils/platform.mock';
import { settle } from '../features/spec-utils/settle';
import { CdnRefService } from './cdn-ref.service';
import { cdnRefServiceMock } from './cdn-ref.service.mock';
import { ProtocolDbService } from './protocol-db.service';
import { PROTOCOL_DB_BROWSER_ONLY_ERROR, PROTOCOL_DB_HTTP_OPTIONS, PROTOCOL_DB_WORKER_COUNT } from './protocol-db.service.constant';
import {
  CREATE_POOL_MOCK,
  DB_BINDINGS_MOCK,
  DB_EXEC_RESULTS_MOCK,
  DB_ROWS_MOCK,
  DB_SQL_MOCK,
  PINNED_PROTOCOL_DB_CDN_URL,
  PINNED_SHA_MOCK,
  POOL_CLOSE_ERROR_MESSAGE,
  POOL_CLOSE_MOCK,
  POOL_CREATE_ERROR_MESSAGE,
  POOL_EXEC_ERROR_MESSAGE,
  POOL_EXEC_MOCK,
  POOL_MOCK,
  POOL_OPEN_ERROR_MESSAGE,
  POOL_OPEN_MOCK,
  PROTOCOL_DB_CDN_URL,
} from './protocol-db.service.mock';

vi.mock('sqlite-wasm-http', async () => {
  const mock = await import('./protocol-db.service.mock');

  return { createSQLiteHTTPPool: mock.CREATE_POOL_MOCK };
});

describe('ProtocolDbService', () => {
  let service: ProtocolDbService;

  beforeEach(() => {
    vi.clearAllMocks();
    CREATE_POOL_MOCK.mockResolvedValue(POOL_MOCK);
    POOL_OPEN_MOCK.mockResolvedValue(undefined);
    POOL_EXEC_MOCK.mockResolvedValue(DB_EXEC_RESULTS_MOCK);
    POOL_CLOSE_MOCK.mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [{ provide: CdnRefService, useValue: cdnRefServiceMock() }],
    });
    service = TestBed.inject(ProtocolDbService);
  });

  it('opens one sha-pinned pool per session and unwraps rows into plain objects', async () => {
    await expect(service.query(DB_SQL_MOCK, DB_BINDINGS_MOCK)).resolves.toEqual(DB_ROWS_MOCK);
    expect(CREATE_POOL_MOCK).toHaveBeenCalledExactlyOnceWith({ workers: PROTOCOL_DB_WORKER_COUNT, httpOptions: PROTOCOL_DB_HTTP_OPTIONS });
    expect(POOL_OPEN_MOCK).toHaveBeenCalledExactlyOnceWith(PROTOCOL_DB_CDN_URL);
    expect(POOL_EXEC_MOCK).toHaveBeenCalledExactlyOnceWith(DB_SQL_MOCK, DB_BINDINGS_MOCK, { rowMode: 'object' });

    await expect(service.query(DB_SQL_MOCK), 'bindings are optional').resolves.toEqual(DB_ROWS_MOCK);
    expect(CREATE_POOL_MOCK, 'the pool is cached for the session').toHaveBeenCalledTimes(1);
    expect(POOL_EXEC_MOCK).toHaveBeenLastCalledWith(DB_SQL_MOCK, undefined, { rowMode: 'object' });
  });

  it('a pinned commit swaps in a pool over the new sha, closing the old one even when the close fails', async () => {
    await service.query(DB_SQL_MOCK);

    POOL_CLOSE_MOCK.mockRejectedValueOnce(new Error(POOL_CLOSE_ERROR_MESSAGE));
    TestBed.inject(CdnRefService).pin(PINNED_SHA_MOCK);

    await expect(service.query(DB_SQL_MOCK)).resolves.toEqual(DB_ROWS_MOCK);
    await settle();

    expect(CREATE_POOL_MOCK).toHaveBeenCalledTimes(2);
    expect(POOL_OPEN_MOCK).toHaveBeenLastCalledWith(PINNED_PROTOCOL_DB_CDN_URL);
    expect(POOL_CLOSE_MOCK, 'the superseded pool is released in the background').toHaveBeenCalledTimes(1);
  });

  it('a failed open closes the half-made pool, rejects and is retried by the next query', async () => {
    POOL_OPEN_MOCK.mockRejectedValueOnce(new Error(POOL_OPEN_ERROR_MESSAGE));
    POOL_CLOSE_MOCK.mockRejectedValueOnce(new Error(POOL_CLOSE_ERROR_MESSAGE));

    await expect(service.query(DB_SQL_MOCK), 'e.g. jsDelivr refusing range requests').rejects.toThrow(POOL_OPEN_ERROR_MESSAGE);
    expect(POOL_CLOSE_MOCK, 'a rejecting close is swallowed').toHaveBeenCalledTimes(1);

    await expect(service.query(DB_SQL_MOCK), 'the failed pool was evicted from the cache').resolves.toEqual(DB_ROWS_MOCK);
    expect(CREATE_POOL_MOCK).toHaveBeenCalledTimes(2);
  });

  it('a worker bootstrap failure rejects and is also retried', async () => {
    CREATE_POOL_MOCK.mockRejectedValueOnce(new Error(POOL_CREATE_ERROR_MESSAGE));

    await expect(service.query(DB_SQL_MOCK)).rejects.toThrow(POOL_CREATE_ERROR_MESSAGE);
    await expect(service.query(DB_SQL_MOCK)).resolves.toEqual(DB_ROWS_MOCK);
  });

  it('a failed statement rejects but keeps the healthy pool for the next query', async () => {
    POOL_EXEC_MOCK.mockRejectedValueOnce(new Error(POOL_EXEC_ERROR_MESSAGE));

    await expect(service.query(DB_SQL_MOCK)).rejects.toThrow(POOL_EXEC_ERROR_MESSAGE);
    await expect(service.query(DB_SQL_MOCK)).resolves.toEqual(DB_ROWS_MOCK);
    expect(CREATE_POOL_MOCK).toHaveBeenCalledTimes(1);
  });
});

describe('ProtocolDbService during prerender', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: CdnRefService, useValue: cdnRefServiceMock() },
        { provide: PLATFORM_ID, useValue: SERVER_PLATFORM_ID },
      ],
    });
  });

  it('rejects before any wasm or worker code is imported', async () => {
    await expect(TestBed.inject(ProtocolDbService).query(DB_SQL_MOCK)).rejects.toThrow(PROTOCOL_DB_BROWSER_ONLY_ERROR);
    expect(CREATE_POOL_MOCK).not.toHaveBeenCalled();
  });
});

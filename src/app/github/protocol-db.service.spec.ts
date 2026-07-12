import { DOCUMENT, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { DbSource } from '../core/sqlite/db-source.enum';
import { SERVER_PLATFORM_ID } from '../features/spec-utils/platform.mock';
import { settle } from '../features/spec-utils/settle';
import { CdnRefService } from './cdn-ref.service';
import { cdnRefServiceMock } from './cdn-ref.service.mock';
import { ProtocolDbService } from './protocol-db.service';
import { PROTOCOL_DB_BROWSER_ONLY_ERROR, PROTOCOL_DB_HTTP_OPTIONS, PROTOCOL_DB_WORKER_COUNT } from './protocol-db.service.constant';
import { SQLITE_HTTP_LOADER } from './sqlite-http-loader';
import { LOAD_SQLITE_HTTP_MOCK } from './sqlite-http-loader.mock';
import {
  CREATE_POOL_MOCK,
  DB_EXEC_RESULTS_MOCK,
  DB_PARAMS_MOCK,
  DB_ROWS_MOCK,
  DB_SQL_MOCK,
  DOCUMENT_MOCK,
  LOCAL_DB_URL_MOCK,
  PINNED_PROTOCOL_DB_URL,
  PINNED_SHA_MOCK,
  POOL_CLOSE_ERROR_MESSAGE,
  POOL_CLOSE_MOCK,
  POOL_CREATE_ERROR_MESSAGE,
  POOL_EXEC_ERROR_MESSAGE,
  POOL_EXEC_MOCK,
  POOL_MOCK,
  POOL_OPEN_ERROR_MESSAGE,
  POOL_OPEN_MOCK,
  PROTOCOL_DB_URL,
} from './protocol-db.service.mock';

describe('ProtocolDbService', () => {
  let service: ProtocolDbService;

  beforeEach(() => {
    vi.clearAllMocks();
    CREATE_POOL_MOCK.mockResolvedValue(POOL_MOCK);
    POOL_OPEN_MOCK.mockResolvedValue(undefined);
    POOL_EXEC_MOCK.mockResolvedValue(DB_EXEC_RESULTS_MOCK);
    POOL_CLOSE_MOCK.mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      providers: [
        { provide: CdnRefService, useValue: cdnRefServiceMock() },
        { provide: SQLITE_HTTP_LOADER, useValue: LOAD_SQLITE_HTTP_MOCK },
        { provide: DOCUMENT, useValue: DOCUMENT_MOCK },
      ],
    });
    service = TestBed.inject(ProtocolDbService);
  });

  it('opens one sha-pinned pool per session and unwraps rows into positional value arrays', async () => {
    await expect(service.queryValues(DB_SQL_MOCK, DB_PARAMS_MOCK)).resolves.toEqual(DB_ROWS_MOCK);
    expect(CREATE_POOL_MOCK).toHaveBeenCalledExactlyOnceWith({ workers: PROTOCOL_DB_WORKER_COUNT, httpOptions: PROTOCOL_DB_HTTP_OPTIONS });
    expect(POOL_OPEN_MOCK).toHaveBeenCalledExactlyOnceWith(PROTOCOL_DB_URL);
    expect(POOL_EXEC_MOCK).toHaveBeenCalledExactlyOnceWith(DB_SQL_MOCK, DB_PARAMS_MOCK, { rowMode: 'array' });

    await expect(service.queryValues(DB_SQL_MOCK, []), 'the params are spread into a fresh array').resolves.toEqual(DB_ROWS_MOCK);
    expect(CREATE_POOL_MOCK, 'the pool is cached for the session').toHaveBeenCalledTimes(1);
    expect(POOL_EXEC_MOCK).toHaveBeenLastCalledWith(DB_SQL_MOCK, [], { rowMode: 'array' });
  });

  it('a pinned commit swaps in a pool over the new sha, closing the old one even when the close fails', async () => {
    await service.queryValues(DB_SQL_MOCK, []);

    POOL_CLOSE_MOCK.mockRejectedValueOnce(new Error(POOL_CLOSE_ERROR_MESSAGE));
    TestBed.inject(CdnRefService).pin(PINNED_SHA_MOCK);

    await expect(service.queryValues(DB_SQL_MOCK, [])).resolves.toEqual(DB_ROWS_MOCK);
    await settle();

    expect(CREATE_POOL_MOCK).toHaveBeenCalledTimes(2);
    expect(POOL_OPEN_MOCK).toHaveBeenLastCalledWith(PINNED_PROTOCOL_DB_URL);
    expect(POOL_CLOSE_MOCK, 'the superseded pool is released in the background').toHaveBeenCalledTimes(1);
  });

  it('rides out a transient open failure by reconnecting over a fresh pool within the same query', async () => {
    POOL_OPEN_MOCK.mockRejectedValueOnce(new Error(POOL_OPEN_ERROR_MESSAGE));
    POOL_CLOSE_MOCK.mockRejectedValueOnce(new Error(POOL_CLOSE_ERROR_MESSAGE));

    await expect(service.queryValues(DB_SQL_MOCK, []), 'e.g. jsDelivr momentarily refusing a range request').resolves.toEqual(DB_ROWS_MOCK);
    expect(POOL_CLOSE_MOCK, 'the half-made pool is closed, and a rejecting close is swallowed').toHaveBeenCalledTimes(1);
    expect(CREATE_POOL_MOCK, 'the evicted pool is rebuilt for the retry').toHaveBeenCalledTimes(2);
  });

  it('rides out a transient worker bootstrap failure within the same query', async () => {
    CREATE_POOL_MOCK.mockRejectedValueOnce(new Error(POOL_CREATE_ERROR_MESSAGE));

    await expect(service.queryValues(DB_SQL_MOCK, [])).resolves.toEqual(DB_ROWS_MOCK);
    expect(CREATE_POOL_MOCK).toHaveBeenCalledTimes(2);
  });

  it('rides out a transient statement failure by re-executing on the same healthy pool', async () => {
    POOL_EXEC_MOCK.mockRejectedValueOnce(new Error(POOL_EXEC_ERROR_MESSAGE));

    await expect(service.queryValues(DB_SQL_MOCK, [])).resolves.toEqual(DB_ROWS_MOCK);
    expect(POOL_EXEC_MOCK, 'the retry reuses the open pool').toHaveBeenCalledTimes(2);
    expect(CREATE_POOL_MOCK).toHaveBeenCalledTimes(1);
  });

  it('rejects when every attempt fails, evicting the pool so a later query can recover', async () => {
    POOL_OPEN_MOCK.mockRejectedValue(new Error(POOL_OPEN_ERROR_MESSAGE));

    await expect(service.queryValues(DB_SQL_MOCK, []), 'both attempts hit the same failure').rejects.toThrow(POOL_OPEN_ERROR_MESSAGE);
    expect(POOL_OPEN_MOCK, 'the query was attempted twice').toHaveBeenCalledTimes(2);

    POOL_OPEN_MOCK.mockResolvedValue(undefined);

    await expect(service.queryValues(DB_SQL_MOCK, []), 'the evicted pool is rebuilt once the range works again').resolves.toEqual(
      DB_ROWS_MOCK,
    );
  });
});

describe('ProtocolDbService during prerender', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: CdnRefService, useValue: cdnRefServiceMock() },
        { provide: SQLITE_HTTP_LOADER, useValue: LOAD_SQLITE_HTTP_MOCK },
        { provide: PLATFORM_ID, useValue: SERVER_PLATFORM_ID },
      ],
    });
  });

  it('rejects before any wasm or worker code is imported', async () => {
    await expect(TestBed.inject(ProtocolDbService).queryValues(DB_SQL_MOCK, [])).rejects.toThrow(PROTOCOL_DB_BROWSER_ONLY_ERROR);
    expect(CREATE_POOL_MOCK).not.toHaveBeenCalled();
  });
});

describe('ProtocolDbService reading a local db', () => {
  const originalDbSource = environment.dbSource;
  const originalLocalDbUrl = environment.localDbUrl;
  const cdnRef = cdnRefServiceMock();

  beforeEach(() => {
    vi.clearAllMocks();
    CREATE_POOL_MOCK.mockResolvedValue(POOL_MOCK);
    POOL_OPEN_MOCK.mockResolvedValue(undefined);
    POOL_EXEC_MOCK.mockResolvedValue(DB_EXEC_RESULTS_MOCK);
    environment.dbSource = DbSource.Local;
    environment.localDbUrl = LOCAL_DB_URL_MOCK;
    TestBed.configureTestingModule({
      providers: [
        { provide: CdnRefService, useValue: cdnRef },
        { provide: SQLITE_HTTP_LOADER, useValue: LOAD_SQLITE_HTTP_MOCK },
      ],
    });
  });

  afterEach(() => {
    environment.dbSource = originalDbSource;
    environment.localDbUrl = originalLocalDbUrl;
  });

  it('opens the fixed on-disk url and never resolves a CDN ref', async () => {
    const resolveSpy = vi.spyOn(cdnRef, 'resolve');

    await expect(TestBed.inject(ProtocolDbService).queryValues(DB_SQL_MOCK, DB_PARAMS_MOCK)).resolves.toEqual(DB_ROWS_MOCK);
    expect(POOL_OPEN_MOCK).toHaveBeenCalledExactlyOnceWith(LOCAL_DB_URL_MOCK);
    expect(resolveSpy, 'the local source never touches the CDN').not.toHaveBeenCalled();
  });
});

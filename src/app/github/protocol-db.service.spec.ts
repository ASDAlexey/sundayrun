import { DOCUMENT, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { DbSource } from '../core/sqlite/db-source.enum';
import { FAKE_SQLITE3_STATE, FakeDb, SQLITE_ERROR_RC, resetFakeSqlite3 } from '../core/sqlite/spec-utils/fake-sqlite3';
import { SERVER_PLATFORM_ID } from '../features/spec-utils/platform.mock';
import { settle } from '../features/spec-utils/settle';
import { CdnRefService } from './cdn-ref.service';
import { cdnRefServiceMock } from './cdn-ref.service.mock';
import { DbFreshnessService } from './db-freshness.service';
import { dbFreshnessServiceMock } from './db-freshness.service.mock';
import { ProtocolDbService } from './protocol-db.service';
import { PROTOCOL_DB_BROWSER_ONLY_ERROR, PROTOCOL_DB_FETCH_ERROR_PREFIX } from './protocol-db.service.constant';
import {
  DB_BYTES_MOCK,
  DB_CLOSE_ERROR_MESSAGE,
  DB_EXEC_ERROR_MESSAGE,
  DB_MISSING_STATUS,
  DB_NETWORK_ERROR_MESSAGE,
  DB_PARAMS_MOCK,
  DB_RAW_ROWS_MOCK,
  DB_ROWS_MOCK,
  DB_SQL_MOCK,
  DOCUMENT_MOCK,
  FALLBACK_PROTOCOL_DB_URL,
  LOCAL_DB_URL_MOCK,
  PINNED_PROTOCOL_DB_URL,
  PINNED_SHA_MOCK,
  PROTOCOL_DB_URL,
} from './protocol-db.service.mock';

vi.mock('@sqlite.org/sqlite-wasm', async () => {
  const fake = await import('../core/sqlite/spec-utils/fake-sqlite3');

  return { default: () => Promise.resolve(fake.FAKE_SQLITE3) };
});

/** A download that answers the db image, recording the urls the service asked for. */
function dbFetchMock(): typeof fetch {
  return vi.fn(() => Promise.resolve(new Response(DB_BYTES_MOCK)));
}

function fetchedUrls(): string[] {
  return vi.mocked(fetch).mock.calls.map(([url]) => String(url));
}

describe('ProtocolDbService', () => {
  const freshnessMock = dbFreshnessServiceMock();

  let service: ProtocolDbService;

  beforeEach(() => {
    vi.clearAllMocks();
    resetFakeSqlite3();
    FAKE_SQLITE3_STATE.rowsBySql = { [DB_SQL_MOCK]: DB_RAW_ROWS_MOCK };
    freshnessMock.pinnedDbAvailable.mockResolvedValue(true);
    vi.stubGlobal('fetch', dbFetchMock());
    TestBed.configureTestingModule({
      providers: [
        { provide: CdnRefService, useValue: cdnRefServiceMock() },
        { provide: DbFreshnessService, useValue: freshnessMock },
        { provide: DOCUMENT, useValue: DOCUMENT_MOCK },
      ],
    });
    service = TestBed.inject(ProtocolDbService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('downloads the sha-named db once per session and unwraps rows into positional value arrays', async () => {
    await expect(service.queryValues(DB_SQL_MOCK, DB_PARAMS_MOCK)).resolves.toEqual(DB_ROWS_MOCK);
    expect(fetchedUrls(), 'the whole file, in one request').toEqual([PROTOCOL_DB_URL]);
    expect(FAKE_SQLITE3_STATE.dbs[0].executed[0]).toEqual({ sql: DB_SQL_MOCK, bind: DB_PARAMS_MOCK });

    await expect(service.queryValues(DB_SQL_MOCK, []), 'the params are spread into a fresh array').resolves.toEqual(DB_ROWS_MOCK);
    expect(fetchedUrls(), 'the connection is cached for the session — no second download').toHaveLength(1);
    expect(FAKE_SQLITE3_STATE.dbs, 'and no second connection either').toHaveLength(1);
  });

  it('reads the plain-named fallback while the deploy carrying the pinned copy is in flight', async () => {
    freshnessMock.pinnedDbAvailable.mockResolvedValue(false);

    await expect(service.queryValues(DB_SQL_MOCK, [])).resolves.toEqual(DB_ROWS_MOCK);
    expect(fetchedUrls(), 'the previous data stays readable under the plain name').toEqual([FALLBACK_PROTOCOL_DB_URL]);
  });

  it('a pinned commit re-downloads over the new sha, closing the old one even when the close fails', async () => {
    await service.queryValues(DB_SQL_MOCK, []);

    // A connection that refuses to close is still superseded: the new one must open regardless.
    vi.spyOn(FAKE_SQLITE3_STATE.dbs[0], 'close').mockImplementationOnce(() => {
      throw new Error(DB_CLOSE_ERROR_MESSAGE);
    });
    TestBed.inject(CdnRefService).pin(PINNED_SHA_MOCK);

    await expect(service.queryValues(DB_SQL_MOCK, [])).resolves.toEqual(DB_ROWS_MOCK);
    await settle();

    expect(fetchedUrls(), 'the new sha is read from scratch').toEqual([PROTOCOL_DB_URL, PINNED_PROTOCOL_DB_URL]);
    expect(FAKE_SQLITE3_STATE.dbs, 'and the superseded connection was let go in the background').toHaveLength(2);
  });

  it('rides out a transient download failure by reconnecting within the same query', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error(DB_NETWORK_ERROR_MESSAGE));

    await expect(service.queryValues(DB_SQL_MOCK, []), 'e.g. the connection dropped mid-download').resolves.toEqual(DB_ROWS_MOCK);
    expect(fetchedUrls(), 'the evicted connection is rebuilt for the retry').toHaveLength(2);
  });

  it('rides out a transient statement failure by re-executing on the same healthy connection', async () => {
    const exec = vi.spyOn(FakeDb.prototype, 'exec').mockImplementationOnce(() => {
      throw new Error(DB_EXEC_ERROR_MESSAGE);
    });

    await expect(service.queryValues(DB_SQL_MOCK, [])).resolves.toEqual(DB_ROWS_MOCK);
    expect(fetchedUrls(), 'the retry reuses the open connection').toHaveLength(1);

    exec.mockRestore();
  });

  it('closes the half-made connection when the image itself is refused by the engine', async () => {
    FAKE_SQLITE3_STATE.deserializeRc = SQLITE_ERROR_RC;

    await expect(service.queryValues(DB_SQL_MOCK, []), 'a truncated or corrupt download must not be queried').rejects.toThrow();
    expect(
      FAKE_SQLITE3_STATE.dbs.every((db) => db.closed),
      'no connection is left holding wasm memory',
    ).toBe(true);
  });

  it('rejects a missing db by status, evicting the connection so a later query can recover', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: DB_MISSING_STATUS }));

    await expect(service.queryValues(DB_SQL_MOCK, []), 'both attempts hit the same 404').rejects.toThrow(
      `${PROTOCOL_DB_FETCH_ERROR_PREFIX}${DB_MISSING_STATUS}`,
    );
    expect(fetchedUrls(), 'the query was attempted twice').toHaveLength(2);

    vi.mocked(fetch).mockResolvedValue(new Response(DB_BYTES_MOCK));

    await expect(service.queryValues(DB_SQL_MOCK, []), 'the evicted connection is rebuilt once the file is there').resolves.toEqual(
      DB_ROWS_MOCK,
    );
  });
});

describe('ProtocolDbService during prerender', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetFakeSqlite3();
    vi.stubGlobal('fetch', dbFetchMock());
    TestBed.configureTestingModule({
      providers: [
        { provide: CdnRefService, useValue: cdnRefServiceMock() },
        { provide: PLATFORM_ID, useValue: SERVER_PLATFORM_ID },
      ],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects before any wasm is imported or any byte is downloaded', async () => {
    await expect(TestBed.inject(ProtocolDbService).queryValues(DB_SQL_MOCK, [])).rejects.toThrow(PROTOCOL_DB_BROWSER_ONLY_ERROR);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('ProtocolDbService reading a local db', () => {
  const originalDbSource = environment.dbSource;
  const originalLocalDbUrl = environment.localDbUrl;
  const cdnRef = cdnRefServiceMock();

  beforeEach(() => {
    vi.clearAllMocks();
    resetFakeSqlite3();
    FAKE_SQLITE3_STATE.rowsBySql = { [DB_SQL_MOCK]: DB_RAW_ROWS_MOCK };
    environment.dbSource = DbSource.Local;
    environment.localDbUrl = LOCAL_DB_URL_MOCK;
    vi.stubGlobal('fetch', dbFetchMock());
    TestBed.configureTestingModule({ providers: [{ provide: CdnRefService, useValue: cdnRef }] });
  });

  afterEach(() => {
    environment.dbSource = originalDbSource;
    environment.localDbUrl = originalLocalDbUrl;
    vi.unstubAllGlobals();
  });

  it('downloads the fixed on-disk url and never resolves a CDN ref', async () => {
    const resolveSpy = vi.spyOn(cdnRef, 'resolve');

    await expect(TestBed.inject(ProtocolDbService).queryValues(DB_SQL_MOCK, DB_PARAMS_MOCK)).resolves.toEqual(DB_ROWS_MOCK);
    expect(fetchedUrls()).toEqual([LOCAL_DB_URL_MOCK]);
    expect(resolveSpy, 'the local source never touches the CDN').not.toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';

import { SQLITE_HTTP_LOADER, loadSqliteHttp } from './sqlite-http-loader';
import { SQLITE_HTTP_MODULE_PATH } from './sqlite-http-loader.constant';
import { DATA_URL_MODULE, EXPECTED_MODULE } from './sqlite-http-loader.mock';

describe('loadSqliteHttp', () => {
  it('resolves the self-hosted entry against <base href> and imports it through the injected seam', async () => {
    const importModule = vi.fn(() => Promise.resolve(EXPECTED_MODULE));

    await expect(loadSqliteHttp(importModule)).resolves.toBe(EXPECTED_MODULE);
    expect(importModule).toHaveBeenCalledExactlyOnceWith(new URL(SQLITE_HTTP_MODULE_PATH, document.baseURI).href);
  });

  it('imports through a native dynamic import by default', async () => {
    const module = await loadSqliteHttp(undefined, DATA_URL_MODULE);

    expect(module.createSQLiteHTTPPool).toBeTypeOf('function');
  });

  it('is the default injectable loader behind SQLITE_HTTP_LOADER', () => {
    expect(TestBed.inject(SQLITE_HTTP_LOADER)).toBe(loadSqliteHttp);
  });
});

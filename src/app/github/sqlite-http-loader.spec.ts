import { DOCUMENT } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SQLITE_HTTP_LOADER, loadSqliteHttp } from './sqlite-http-loader';
import { SQLITE_HTTP_MODULE_PATH } from './sqlite-http-loader.constant';
import { DATA_URL_MODULE, EXPECTED_MODULE } from './sqlite-http-loader.mock';

describe('loadSqliteHttp', () => {
  it('imports the given module url through the injected seam', async () => {
    const importModule = vi.fn(() => Promise.resolve(EXPECTED_MODULE));
    const moduleUrl = new URL(SQLITE_HTTP_MODULE_PATH, TestBed.inject(DOCUMENT).baseURI).href;

    await expect(loadSqliteHttp(moduleUrl, importModule)).resolves.toBe(EXPECTED_MODULE);
    expect(importModule).toHaveBeenCalledExactlyOnceWith(moduleUrl);
  });

  it('imports through a native dynamic import by default', async () => {
    const module = await loadSqliteHttp(DATA_URL_MODULE);

    expect(module.createSQLiteHTTPPool).toBeTypeOf('function');
  });

  it('binds the self-hosted url resolved against <base href> behind SQLITE_HTTP_LOADER', async () => {
    const importModule = vi.fn(() => Promise.resolve(EXPECTED_MODULE));
    const expectedUrl = new URL(SQLITE_HTTP_MODULE_PATH, TestBed.inject(DOCUMENT).baseURI).href;

    await expect(TestBed.inject(SQLITE_HTTP_LOADER)(importModule)).resolves.toBe(EXPECTED_MODULE);
    expect(importModule).toHaveBeenCalledExactlyOnceWith(expectedUrl);
  });
});

import { bytesToBase64 } from '../encoding/base64';
import { HTTP_NOT_FOUND } from './github-api.constant';
import { buildProtocolDbCommitFile } from './protocol-db-file';
import { CURRENT_DB_BYTES, DB_CONTENTS_KEY, DB_TOKEN, UPDATED_DB_BYTES } from './protocol-db-file.mock';
import { SERVER_ERROR_STATUS } from './repo-contents.mock';
import { PROTOCOL_DB_PATH } from './protocols-repo.constant';
import { routeFetch, statusResponse } from './spec-utils/github-fetch-router';

const EXPECTED_DB_COMMIT_FILE = { path: PROTOCOL_DB_PATH, base64Content: bytesToBase64(UPDATED_DB_BYTES) };

describe('buildProtocolDbCommitFile', () => {
  it('downloads the current db, feeds it to the update and returns the rebuilt bytes as a base64 commit file', async () => {
    const updateDb = vi.fn(() => Promise.resolve(UPDATED_DB_BYTES));
    const fetchFn = routeFetch({ [DB_CONTENTS_KEY]: () => new Response(CURRENT_DB_BYTES) });

    await expect(buildProtocolDbCommitFile(DB_TOKEN, updateDb, fetchFn)).resolves.toEqual(EXPECTED_DB_COMMIT_FILE);
    expect(updateDb).toHaveBeenCalledWith(CURRENT_DB_BYTES);
  });

  it('builds from scratch when no db is published yet: a 404 becomes null bytes for the update', async () => {
    const updateDb = vi.fn(() => Promise.resolve(UPDATED_DB_BYTES));
    const fetchFn = routeFetch({ [DB_CONTENTS_KEY]: () => statusResponse(HTTP_NOT_FOUND) });

    await expect(buildProtocolDbCommitFile(DB_TOKEN, updateDb, fetchFn)).resolves.toEqual(EXPECTED_DB_COMMIT_FILE);
    expect(updateDb).toHaveBeenCalledWith(null);
  });

  it('yields null on a download or wasm failure, so the publication proceeds without the derived db', async () => {
    const neverCalled = vi.fn(() => Promise.resolve(UPDATED_DB_BYTES));
    const failingDownload = routeFetch({ [DB_CONTENTS_KEY]: () => statusResponse(SERVER_ERROR_STATUS) });
    const rejectingUpdate = vi.fn(() => Promise.reject(new Error('wasm failed')));
    const okDownload = routeFetch({ [DB_CONTENTS_KEY]: () => new Response(CURRENT_DB_BYTES) });

    await expect(buildProtocolDbCommitFile(DB_TOKEN, neverCalled, failingDownload)).resolves.toBeNull();
    await expect(buildProtocolDbCommitFile(DB_TOKEN, rejectingUpdate, okDownload)).resolves.toBeNull();
    expect(neverCalled).not.toHaveBeenCalled();
  });
});

import { Mock } from 'vitest';

import { corosDayOf, corosDownloadGpx, corosLogin, corosQueryRuns, isoDateOfCorosDay } from './coros-api';
import { COROS_OK_RESULT, COROS_REGION_API_URLS, COROS_TOKEN_HEADER } from './coros-api.constant';
import { CorosApiError } from './coros-api.error';
import {
  COROS_BROKEN_ROWS_MOCK,
  COROS_EMAIL_MOCK,
  COROS_FAILURE_BODY_MOCK,
  COROS_FILE_URL_MOCK,
  COROS_GPX_MOCK,
  COROS_LABEL_ID_MOCK,
  COROS_PASSWORD_MD5_MOCK,
  COROS_PASSWORD_MOCK,
  COROS_RACE_ACTIVITY_MOCK,
  COROS_RACE_DATE_ISO_MOCK,
  COROS_RACE_ROW_MOCK,
  COROS_TOKEN_MOCK,
  COROS_WARMUP_ROW_MOCK,
} from './coros-api.mock';
import { CorosFetchFn } from './coros-fetch.type';
import { CorosRegion } from './coros-region.enum';

const EU_API = COROS_REGION_API_URLS[CorosRegion.Eu];

const jsonResponse = (body: unknown): Response => new Response(JSON.stringify(body));

const okFetch = (data: unknown): Mock<CorosFetchFn> => vi.fn(() => Promise.resolve(jsonResponse({ result: COROS_OK_RESULT, data })));

describe('corosLogin', () => {
  it('sends the password as MD5 and returns the token', async () => {
    const fetchFn = okFetch({ accessToken: COROS_TOKEN_MOCK });

    await expect(corosLogin(COROS_EMAIL_MOCK, COROS_PASSWORD_MOCK, CorosRegion.Eu, fetchFn)).resolves.toBe(COROS_TOKEN_MOCK);

    const [url, init] = fetchFn.mock.calls[0];
    const body: Record<string, unknown> = JSON.parse(String(init?.body));

    expect(url).toBe(`${EU_API}/account/login`);
    expect(body['pwd']).toBe(COROS_PASSWORD_MD5_MOCK);
    expect(JSON.stringify(body)).not.toContain(COROS_PASSWORD_MOCK);
  });

  it('reports the region host the account lives in', async () => {
    const fetchFn = okFetch({ accessToken: COROS_TOKEN_MOCK });

    await corosLogin(COROS_EMAIL_MOCK, COROS_PASSWORD_MOCK, CorosRegion.Cn, fetchFn);

    expect(fetchFn.mock.calls[0][0]).toBe(`${COROS_REGION_API_URLS[CorosRegion.Cn]}/account/login`);
  });

  it('fails when the answer carries no token', async () => {
    const fetchFn = okFetch({});

    await expect(corosLogin(COROS_EMAIL_MOCK, COROS_PASSWORD_MOCK, CorosRegion.Eu, fetchFn)).rejects.toThrow(CorosApiError);
  });

  it('surfaces the Coros result code of a rejected login', async () => {
    const fetchFn: Mock<CorosFetchFn> = vi.fn(() => Promise.resolve(jsonResponse(COROS_FAILURE_BODY_MOCK)));

    await expect(corosLogin(COROS_EMAIL_MOCK, COROS_PASSWORD_MOCK, CorosRegion.Eu, fetchFn)).rejects.toMatchObject({
      result: COROS_FAILURE_BODY_MOCK.result,
      message: COROS_FAILURE_BODY_MOCK.message,
    });
  });
});

describe('corosQueryRuns', () => {
  it('asks Coros to filter the days and parses the rows', async () => {
    const fetchFn = okFetch({ dataList: [COROS_RACE_ROW_MOCK, COROS_WARMUP_ROW_MOCK] });
    const runs = await corosQueryRuns(COROS_TOKEN_MOCK, COROS_RACE_DATE_ISO_MOCK, COROS_RACE_DATE_ISO_MOCK, CorosRegion.Eu, fetchFn);

    expect(runs[0]).toEqual(COROS_RACE_ACTIVITY_MOCK);
    expect(runs).toHaveLength(2);

    const [url, init] = fetchFn.mock.calls[0];

    expect(url).toContain('startDay=20260726&endDay=20260726');
    expect(url).toContain('modeList=100');
    expect(init?.headers).toEqual({ [COROS_TOKEN_HEADER]: COROS_TOKEN_MOCK });
  });

  it('drops rows that cannot be matched to a race instead of guessing', async () => {
    const fetchFn = okFetch({ dataList: COROS_BROKEN_ROWS_MOCK });

    await expect(
      corosQueryRuns(COROS_TOKEN_MOCK, COROS_RACE_DATE_ISO_MOCK, COROS_RACE_DATE_ISO_MOCK, CorosRegion.Eu, fetchFn),
    ).resolves.toEqual([]);
  });

  it('treats a missing list as no runs', async () => {
    const fetchFn = okFetch({});

    await expect(
      corosQueryRuns(COROS_TOKEN_MOCK, COROS_RACE_DATE_ISO_MOCK, COROS_RACE_DATE_ISO_MOCK, CorosRegion.Eu, fetchFn),
    ).resolves.toEqual([]);
  });

  it('fails on a transport error', async () => {
    const fetchFn: Mock<CorosFetchFn> = vi.fn(() => Promise.resolve(new Response('', { status: 500 })));

    await expect(
      corosQueryRuns(COROS_TOKEN_MOCK, COROS_RACE_DATE_ISO_MOCK, COROS_RACE_DATE_ISO_MOCK, CorosRegion.Eu, fetchFn),
    ).rejects.toThrow(CorosApiError);
  });

  it('fails when the body is not JSON at all', async () => {
    const fetchFn: Mock<CorosFetchFn> = vi.fn(() => Promise.resolve(new Response('<html>maintenance</html>')));

    await expect(
      corosQueryRuns(COROS_TOKEN_MOCK, COROS_RACE_DATE_ISO_MOCK, COROS_RACE_DATE_ISO_MOCK, CorosRegion.Eu, fetchFn),
    ).rejects.toThrow(CorosApiError);
  });
});

describe('corosDownloadGpx', () => {
  it('follows the CDN link with a header-free request, so no preflight is triggered', async () => {
    const fetchFn: Mock<CorosFetchFn> = vi
      .fn<CorosFetchFn>()
      .mockResolvedValueOnce(jsonResponse({ result: COROS_OK_RESULT, data: { fileUrl: COROS_FILE_URL_MOCK } }))
      .mockResolvedValueOnce(new Response(COROS_GPX_MOCK));

    await expect(corosDownloadGpx(COROS_TOKEN_MOCK, COROS_LABEL_ID_MOCK, CorosRegion.Eu, fetchFn)).resolves.toBe(COROS_GPX_MOCK);

    const [downloadUrl, downloadInit] = fetchFn.mock.calls[0];
    const [fileUrl, fileInit] = fetchFn.mock.calls[1];

    expect(downloadUrl).toContain(`${EU_API}/activity/detail/download?`);
    expect(downloadInit?.method).toBe('POST');
    expect(fileUrl).toBe(COROS_FILE_URL_MOCK);
    expect(fileInit).toBeUndefined();
  });

  it('fails when the activity has no file behind it', async () => {
    const fetchFn = okFetch({});

    await expect(corosDownloadGpx(COROS_TOKEN_MOCK, COROS_LABEL_ID_MOCK, CorosRegion.Eu, fetchFn)).rejects.toThrow(CorosApiError);
  });

  it('fails when the CDN refuses the link', async () => {
    const fetchFn: Mock<CorosFetchFn> = vi
      .fn<CorosFetchFn>()
      .mockResolvedValueOnce(jsonResponse({ result: COROS_OK_RESULT, data: { fileUrl: COROS_FILE_URL_MOCK } }))
      .mockResolvedValueOnce(new Response('', { status: 403 }));

    await expect(corosDownloadGpx(COROS_TOKEN_MOCK, COROS_LABEL_ID_MOCK, CorosRegion.Eu, fetchFn)).rejects.toThrow(CorosApiError);
  });
});

describe('coros defaults and gaps', () => {
  it('falls back to the global fetch when none is injected', async () => {
    const fetchSpy = vi.fn((url: string) =>
      Promise.resolve(
        url === COROS_FILE_URL_MOCK
          ? new Response(COROS_GPX_MOCK)
          : jsonResponse({
              result: COROS_OK_RESULT,
              data: { accessToken: COROS_TOKEN_MOCK, dataList: [], fileUrl: COROS_FILE_URL_MOCK },
            }),
      ),
    );

    vi.stubGlobal('fetch', fetchSpy);

    await expect(corosLogin(COROS_EMAIL_MOCK, COROS_PASSWORD_MOCK, CorosRegion.Eu)).resolves.toBe(COROS_TOKEN_MOCK);
    await expect(corosQueryRuns(COROS_TOKEN_MOCK, COROS_RACE_DATE_ISO_MOCK, COROS_RACE_DATE_ISO_MOCK, CorosRegion.Eu)).resolves.toEqual([]);
    await expect(corosDownloadGpx(COROS_TOKEN_MOCK, COROS_LABEL_ID_MOCK, CorosRegion.Eu)).resolves.toBe(COROS_GPX_MOCK);

    vi.unstubAllGlobals();
  });

  it('treats an empty token and an empty file link as absent', async () => {
    const emptyToken = okFetch({ accessToken: '' });
    const emptyLink = okFetch({ fileUrl: '' });

    await expect(corosLogin(COROS_EMAIL_MOCK, COROS_PASSWORD_MOCK, CorosRegion.Eu, emptyToken)).rejects.toThrow(CorosApiError);
    await expect(corosDownloadGpx(COROS_TOKEN_MOCK, COROS_LABEL_ID_MOCK, CorosRegion.Eu, emptyLink)).rejects.toThrow(CorosApiError);
  });

  it('keeps a nameless activity, and explains a failure Coros left unexplained', async () => {
    const nameless = okFetch({ dataList: [{ ...COROS_RACE_ROW_MOCK, name: undefined }] });
    const silent: Mock<CorosFetchFn> = vi.fn(() => Promise.resolve(jsonResponse({ result: '1002' })));

    const runs = await corosQueryRuns(COROS_TOKEN_MOCK, COROS_RACE_DATE_ISO_MOCK, COROS_RACE_DATE_ISO_MOCK, CorosRegion.Eu, nameless);

    expect(runs[0].name).toBe('');

    await expect(
      corosQueryRuns(COROS_TOKEN_MOCK, COROS_RACE_DATE_ISO_MOCK, COROS_RACE_DATE_ISO_MOCK, CorosRegion.Eu, silent),
    ).rejects.toThrow('Coros request failed');
  });
});

describe('coros day translation', () => {
  it('round-trips an ISO date through the Coros day format', () => {
    expect(corosDayOf(COROS_RACE_DATE_ISO_MOCK)).toBe('20260726');
    expect(isoDateOfCorosDay(20260726)).toBe(COROS_RACE_DATE_ISO_MOCK);
  });

  it('refuses a day that is not eight digits', () => {
    expect(isoDateOfCorosDay(202607)).toBeNull();
  });
});

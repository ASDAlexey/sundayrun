import { TestBed } from '@angular/core/testing';

import { COROS_OK_RESULT } from './coros-api.constant';
import {
  COROS_EMAIL_MOCK,
  COROS_FILE_URL_MOCK,
  COROS_GPX_MOCK,
  COROS_LABEL_ID_MOCK,
  COROS_PASSWORD_MOCK,
  COROS_RACE_ACTIVITY_MOCK,
  COROS_RACE_DATE_ISO_MOCK,
  COROS_RACE_ROW_MOCK,
  COROS_TOKEN_MOCK,
} from './coros-api.mock';
import { CorosClient } from './coros.client';
import { CorosRegion } from './coros-region.enum';

describe('CorosClient', () => {
  it('passes every call through to the endpoints', async () => {
    const client = TestBed.inject(CorosClient);

    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        Promise.resolve(
          url === COROS_FILE_URL_MOCK
            ? new Response(COROS_GPX_MOCK)
            : new Response(
                JSON.stringify({
                  result: COROS_OK_RESULT,
                  data: { accessToken: COROS_TOKEN_MOCK, dataList: [COROS_RACE_ROW_MOCK], fileUrl: COROS_FILE_URL_MOCK },
                }),
              ),
        ),
      ),
    );

    await expect(client.login(COROS_EMAIL_MOCK, COROS_PASSWORD_MOCK, CorosRegion.Eu)).resolves.toBe(COROS_TOKEN_MOCK);
    await expect(client.queryRuns(COROS_TOKEN_MOCK, COROS_RACE_DATE_ISO_MOCK, COROS_RACE_DATE_ISO_MOCK, CorosRegion.Eu)).resolves.toEqual([
      COROS_RACE_ACTIVITY_MOCK,
    ]);
    await expect(client.downloadGpx(COROS_TOKEN_MOCK, COROS_LABEL_ID_MOCK, CorosRegion.Eu)).resolves.toBe(COROS_GPX_MOCK);

    vi.unstubAllGlobals();
  });
});

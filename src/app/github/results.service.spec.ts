import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { EVENT_DATE_ISO } from '../core/github/event-paths.mock';
import { buildEventResultsFile } from '../core/github/results-file';
import { PROTOCOL_ROWS, RACE_EVENT } from '../core/github/spec-utils/race-fixtures';
import { ProtocolDb } from '../core/sqlite/protocol-db.interface';
import { ProtocolDbValue } from '../core/sqlite/protocol-db-value.type';
import { createMemoryProtocolDb } from '../core/sqlite/spec-utils/protocol-db-memory';
import { SEED_RACE_EVENT, SEED_RACE_RESULTS } from './protocol-db-queries.mock';
import { PROTOCOL_DB_ERROR_MESSAGE } from './protocol-db.service.mock';
import { PROTOCOL_DB } from './protocol-db.token';
import { ResultsService } from './results.service';

describe('ResultsService', () => {
  let close: (() => void) | null = null;

  afterEach(() => {
    close?.();
    close = null;
  });

  async function serviceOver(db: ProtocolDb): Promise<ResultsService> {
    TestBed.configureTestingModule({ providers: [{ provide: PROTOCOL_DB, useValue: db }] });

    return TestBed.inject(ResultsService);
  }

  it('serves the protocol from sql and reuses the cached load per slug', async () => {
    const memory = await createMemoryProtocolDb([...SEED_RACE_EVENT, ...SEED_RACE_RESULTS]);

    close = memory.close;

    const queryValues = vi.fn((sql: string, params: readonly ProtocolDbValue[]) => memory.db.queryValues(sql, params));
    const service = await serviceOver({ queryValues });

    const firstLoad = service.loadResults(EVENT_DATE_ISO);

    expect(service.loadResults(EVENT_DATE_ISO), 'a call racing the first load shares the in-flight promise').toBe(firstLoad);
    await expect(firstLoad).resolves.toEqual(buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS));
    await expect(service.loadResults(EVENT_DATE_ISO), 'the cached load is reused').resolves.toEqual(
      buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS),
    );
    expect(queryValues, 'one event select plus one results select, then the cache answers').toHaveBeenCalledTimes(2);
    await expect(service.loadParticipantRuns(EVENT_DATE_ISO), 'no seeded runs — the notables source is empty').resolves.toEqual([]);
    await expect(service.loadFinishCountsBefore(EVENT_DATE_ISO), 'no seeded runs — no stored finish counts').resolves.toEqual({});
  });

  it('evicts a null and a rejected load, so a reload sees a protocol published later', async () => {
    const memory = await createMemoryProtocolDb([...SEED_RACE_EVENT, ...SEED_RACE_RESULTS]);

    close = memory.close;

    let mode: 'empty' | 'real' | 'reject' = 'empty';
    const service = await serviceOver({
      queryValues: (sql, params) => {
        if (mode === 'empty') {
          return Promise.resolve([]);
        }

        if (mode === 'reject') {
          return Promise.reject(new Error(PROTOCOL_DB_ERROR_MESSAGE));
        }

        return memory.db.queryValues(sql, params);
      },
    });

    await expect(service.loadResults(EVENT_DATE_ISO), 'an unknown slug resolves to not-found').resolves.toBeNull();

    mode = 'reject';

    await expect(service.loadResults(EVENT_DATE_ISO), 'a persistent db failure rejects').rejects.toMatchObject({
      cause: { message: PROTOCOL_DB_ERROR_MESSAGE },
    });

    mode = 'real';

    await expect(service.loadResults(EVENT_DATE_ISO), 'neither the null nor the rejection was cached').resolves.toEqual(
      buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS),
    );
  });
});

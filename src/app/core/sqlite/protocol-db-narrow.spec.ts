import { narrowValues } from './protocol-db-narrow';
import { createMemoryProtocolDb } from './spec-utils/protocol-db-memory';

describe('narrowValues', () => {
  let close: (() => void) | null = null;

  afterEach(() => {
    close?.();
    close = null;
  });

  it('keeps number/string/null and folds a stray blob the wasm boundary hands back down to null', async () => {
    const memory = await createMemoryProtocolDb([]);

    close = memory.close;

    // `x'01'` is a real BLOB, the one SQLValue kind protocol.db never stores; the engine returns it
    // as a Uint8Array, so this drives the narrower's fold-to-null path against the true boundary.
    await expect(memory.db.queryValues("SELECT 42, 'ok', NULL, x'01'", [])).resolves.toEqual([[42, 'ok', null, null]]);
    expect(narrowValues([1, 'a', null]), 'the primitives pass straight through').toEqual([1, 'a', null]);
  });
});

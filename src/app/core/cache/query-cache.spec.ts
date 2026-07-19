import { createQueryCache } from './query-cache';

describe('createQueryCache', () => {
  it('runs a fresh key once and replays the memoized result', async () => {
    const cache = createQueryCache();
    let calls = 0;
    const load = (): Promise<number> => Promise.resolve(++calls);

    const first = await cache('key', load);
    const second = await cache('key', load);

    expect(first).toBe(1);
    expect(second).toBe(1);
    expect(calls).toBe(1);
  });

  it('keeps a separate entry per key', async () => {
    const cache = createQueryCache();

    const a = await cache('a', () => Promise.resolve('a-value'));
    const b = await cache('b', () => Promise.resolve('b-value'));

    expect(a).toBe('a-value');
    expect(b).toBe('b-value');
  });

  it('shares one in-flight load between concurrent callers of the same key', async () => {
    const cache = createQueryCache();
    let calls = 0;
    const load = (): Promise<number> => Promise.resolve(++calls);

    const [first, second] = await Promise.all([cache('key', load), cache('key', load)]);

    expect(first).toBe(1);
    expect(second).toBe(1);
    expect(calls).toBe(1);
  });

  it('evicts a rejected load so the next call retries it', async () => {
    const cache = createQueryCache();
    let calls = 0;
    const load = (): Promise<number> => {
      calls += 1;

      return calls === 1 ? Promise.reject(new Error('boom')) : Promise.resolve(calls);
    };

    await expect(cache('key', load)).rejects.toThrow('boom');
    const retried = await cache('key', load);

    expect(retried).toBe(2);
    expect(calls).toBe(2);
  });
});

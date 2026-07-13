import { STALE_CHUNK_RELOAD_STORAGE_KEY } from './lazy-chunk-reload.constant';
import { isStaleChunkError, triggerStaleChunkReload } from './lazy-chunk-reload';
import {
  CHUNK_LOAD_ERROR,
  OLD_RELOAD_MS,
  RECENT_RELOAD_MS,
  RELOAD_NOW_MS,
  STALE_CHUNK_ERROR,
  UNRELATED_ERROR,
} from './lazy-chunk-reload.mock';

describe('lazy-chunk-reload', () => {
  const reload = vi.fn();
  const getItem = vi.fn((): string | null => null);
  const setItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    getItem.mockReturnValue(null);
    vi.stubGlobal('location', { reload });
    vi.stubGlobal('sessionStorage', { getItem, setItem });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('recognises a failed lazy import by message or error name and ignores unrelated values', () => {
    expect(isStaleChunkError(STALE_CHUNK_ERROR), 'a dynamic-import failure').toBe(true);
    expect(isStaleChunkError(CHUNK_LOAD_ERROR), 'the ChunkLoadError name variant').toBe(true);
    expect(isStaleChunkError(UNRELATED_ERROR), 'an ordinary error').toBe(false);
    expect(isStaleChunkError('not an error'), 'a non-error value').toBe(false);
  });

  it('reloads once and stamps the guard when no recent reload is recorded', () => {
    expect(triggerStaleChunkReload(RELOAD_NOW_MS)).toBe(true);
    expect(setItem).toHaveBeenCalledWith(STALE_CHUNK_RELOAD_STORAGE_KEY, String(RELOAD_NOW_MS));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('reloads again once the stamped reload has aged past the window', () => {
    getItem.mockReturnValue(String(OLD_RELOAD_MS));

    expect(triggerStaleChunkReload(RELOAD_NOW_MS)).toBe(true);
    expect(reload).toHaveBeenCalledOnce();
  });

  it('does not reload while a recent reload might still be settling', () => {
    getItem.mockReturnValue(String(RECENT_RELOAD_MS));

    expect(triggerStaleChunkReload(RELOAD_NOW_MS)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('does nothing during prerender where location is absent', () => {
    vi.stubGlobal('location', undefined);

    expect(triggerStaleChunkReload(RELOAD_NOW_MS)).toBe(false);
    expect(setItem).not.toHaveBeenCalled();
  });
});

import { mockValueProp, restoreMockedProps } from 'vitest-auto-spy/angular';

import { POSTER_FILE_NAME, POSTER_IMAGE_TYPE, POSTER_PIXEL_RATIO } from './plan-poster.constant';
import { savePlanImage } from './plan-image';

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="20"></svg>';

const BLOB = new Blob(['png'], { type: POSTER_IMAGE_TYPE });

/** A decoded image of a known size, or a load that fails — the two outcomes `load` can see. */
function stubImage(succeeds: boolean): void {
  vi.stubGlobal(
    'Image',
    class {
      width = 10;
      height = 20;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => (succeeds ? this.onload?.() : this.onerror?.()));
      }
    },
  );
}

/** Typed as a `PropertyKey` so `mockValueProp` takes the escape-hatch overload: a partial 2D
 * context cannot satisfy `getContext`'s own overload set, and casts are not allowed here. */
const GET_CONTEXT: PropertyKey = 'getContext';

/**
 * A 2D context that records what was drawn, or none at all — the two the rasteriser can meet.
 *
 * `mockValueProp` rather than `Object.defineProperty`: the patch is on a prototype that outlives
 * this file, and this one restores itself.
 */
function stubCanvas(hasContext: boolean, blob: Blob | null): { drawn: unknown[][] } {
  const drawn: unknown[][] = [];
  const context = { drawImage: (...args: unknown[]): void => void drawn.push(args) };
  const getContext = (): typeof context | null => (hasContext ? context : null);

  mockValueProp(HTMLCanvasElement.prototype, GET_CONTEXT, getContext);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(blob));

  return { drawn };
}

describe('savePlanImage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    restoreMockedProps();
  });

  it('rasterises at twice the declared size and downloads when there is no share sheet', async () => {
    stubImage(true);

    const { drawn } = stubCanvas(true, BLOB);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:plan', revokeObjectURL: vi.fn() });

    expect(await savePlanImage({ svg: SVG, fileName: POSTER_FILE_NAME, document: globalThis.document })).toBe(true);
    expect(drawn, 'the poster is drawn once, scaled up so a desktop does not get a thumbnail').toEqual([
      [expect.anything(), 0, 0, 10 * POSTER_PIXEL_RATIO, 20 * POSTER_PIXEL_RATIO],
    ]);
    expect(click).toHaveBeenCalledOnce();
  });

  it('hands the file to the platform share sheet when there is one', async () => {
    stubImage(true);
    stubCanvas(true, BLOB);

    const share = vi.fn().mockResolvedValue(undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    vi.stubGlobal('navigator', { canShare: () => true, share });

    expect(await savePlanImage({ svg: SVG, fileName: POSTER_FILE_NAME, document: globalThis.document })).toBe(true);
    expect(share.mock.calls[0][0].files[0].name).toBe(POSTER_FILE_NAME);
    expect(click, 'the share sheet is the whole of the handover — no download behind it').not.toHaveBeenCalled();
  });

  it('treats a dismissed share sheet as done, because the visitor decided', async () => {
    stubImage(true);
    stubCanvas(true, BLOB);
    vi.stubGlobal('navigator', { canShare: () => true, share: vi.fn().mockRejectedValue(new Error('AbortError')) });

    expect(await savePlanImage({ svg: SVG, fileName: POSTER_FILE_NAME, document: globalThis.document })).toBe(true);
  });

  it('declines a share sheet that will not take files', async () => {
    stubImage(true);
    stubCanvas(true, BLOB);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:plan', revokeObjectURL: vi.fn() });
    vi.stubGlobal('navigator', { canShare: () => false, share: vi.fn() });

    expect(await savePlanImage({ svg: SVG, fileName: POSTER_FILE_NAME, document: globalThis.document })).toBe(true);
  });

  it('says so rather than pretending, when the browser gives it nothing to work with', async () => {
    stubImage(false);
    expect(
      await savePlanImage({ svg: SVG, fileName: POSTER_FILE_NAME, document: globalThis.document }),
      'the document would not decode',
    ).toBe(false);

    stubImage(true);
    stubCanvas(false, BLOB);
    expect(await savePlanImage({ svg: SVG, fileName: POSTER_FILE_NAME, document: globalThis.document }), 'no 2D context').toBe(false);

    vi.restoreAllMocks();
    stubImage(true);
    stubCanvas(true, null);
    vi.stubGlobal('navigator', { canShare: () => false });
    expect(
      await savePlanImage({ svg: SVG, fileName: POSTER_FILE_NAME, document: globalThis.document }),
      'the canvas produced no blob',
    ).toBe(false);
  });
});

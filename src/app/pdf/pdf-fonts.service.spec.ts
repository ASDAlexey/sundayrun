import { TestBed } from '@angular/core/testing';

import { PdfFontsService } from './pdf-fonts.service';
import { BOLD_FONT_BYTES } from './pdf-fonts.mock';

describe('PdfFontsService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the vfs through the font loader once and caches the promise for later calls', async () => {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(BOLD_FONT_BYTES)));

    vi.stubGlobal('fetch', fetchMock);

    const service = TestBed.inject(PdfFontsService);
    const first = service.load();
    const second = service.load();

    expect(second).toBe(first);
    await expect(first).resolves.toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

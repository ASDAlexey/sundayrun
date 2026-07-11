import { TestBed } from '@angular/core/testing';

import { ProtocolImageService } from './protocol-image.service';
import { PROTOCOL_IMAGE_PAGE, PROTOCOL_IMAGE_RENDER_ERROR, PROTOCOL_IMAGE_SCALE } from './protocol-image.service.constant';
import {
  GET_DOCUMENT_MOCK,
  GET_PAGE_MOCK,
  GET_VIEWPORT_MOCK,
  PROTOCOL_IMAGE_BLOB_MOCK,
  PROTOCOL_PDF_INPUT_MOCK,
  RENDER_MOCK,
} from './protocol-image.service.mock';

vi.mock('pdfjs-dist', async () => {
  const mock = await import('./protocol-image.service.mock');

  return {
    GlobalWorkerOptions: {},
    getDocument: mock.GET_DOCUMENT_MOCK,
  };
});

describe('ProtocolImageService', () => {
  let service: ProtocolImageService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProtocolImageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rasterizes the first pdf page onto a canvas and returns the png blob', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(PROTOCOL_IMAGE_BLOB_MOCK));

    const result = await service.render(PROTOCOL_PDF_INPUT_MOCK);

    expect(GET_DOCUMENT_MOCK).toHaveBeenCalledOnce();
    expect(GET_PAGE_MOCK).toHaveBeenCalledExactlyOnceWith(PROTOCOL_IMAGE_PAGE);
    expect(GET_VIEWPORT_MOCK).toHaveBeenCalledExactlyOnceWith({ scale: PROTOCOL_IMAGE_SCALE });
    expect(RENDER_MOCK, 'the first page is rendered onto the sized canvas').toHaveBeenCalledOnce();
    expect(result).toBe(PROTOCOL_IMAGE_BLOB_MOCK);
  });

  it('rejects when the canvas cannot encode the image', async () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(null));

    await expect(service.render(PROTOCOL_PDF_INPUT_MOCK)).rejects.toThrow(PROTOCOL_IMAGE_RENDER_ERROR);
  });
});

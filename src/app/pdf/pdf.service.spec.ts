import { TestBed } from '@angular/core/testing';

import { buildProtocolDocDefinition } from '../core/pdf/protocol-doc-definition';
import { PDF_EVENT_MOCK, PDF_FINISH_COUNTS_MOCK, PDF_PREVIOUS_BESTS_MOCK, PDF_ROWS_MOCK } from '../core/pdf/protocol-doc-definition.mock';
import { PdfFontsService } from './pdf-fonts.service';
import { PdfService } from './pdf.service';
import {
  ADD_VIRTUAL_FILE_SYSTEM_MOCK,
  CREATE_PDF_MOCK,
  EXPECTED_FILE_NAME,
  FONTS_MOCK,
  LOAD_FONTS_MOCK,
  PDF_BLOB_MOCK,
  PDF_DOCUMENT_MOCK,
  PDF_MAKE_SHAPE,
  SET_FONTS_MOCK,
} from './pdf.service.mock';

vi.mock('pdfmake/build/pdfmake', async () => {
  const mock = await import('./pdf.service.mock');

  const pdfMake = {
    createPdf: mock.CREATE_PDF_MOCK,
    setFonts: mock.SET_FONTS_MOCK,
    addVirtualFileSystem: mock.ADD_VIRTUAL_FILE_SYSTEM_MOCK,
  };

  return {
    ...pdfMake,
    get default() {
      return mock.PDF_MAKE_SHAPE.useDefault ? pdfMake : undefined;
    },
  };
});

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(() => {
    vi.clearAllMocks();
    PDF_MAKE_SHAPE.useDefault = true;
    LOAD_FONTS_MOCK.mockResolvedValue(FONTS_MOCK);
    CREATE_PDF_MOCK.mockReturnValue(PDF_DOCUMENT_MOCK);
    TestBed.configureTestingModule({ providers: [{ provide: PdfFontsService, useValue: { load: LOAD_FONTS_MOCK } }] });
    service = TestBed.inject(PdfService);
  });

  it('renders blobs through pdfmake in both module shapes and suggests the file name', async () => {
    const first = await service.generateProtocolBlob(PDF_EVENT_MOCK, PDF_ROWS_MOCK, PDF_FINISH_COUNTS_MOCK, PDF_PREVIOUS_BESTS_MOCK);

    PDF_MAKE_SHAPE.useDefault = false;

    const second = await service.generateProtocolBlob(PDF_EVENT_MOCK, PDF_ROWS_MOCK, PDF_FINISH_COUNTS_MOCK, PDF_PREVIOUS_BESTS_MOCK);

    expect(first).toBe(PDF_BLOB_MOCK);
    expect(second).toBe(PDF_BLOB_MOCK);
    expect(LOAD_FONTS_MOCK).toHaveBeenCalledTimes(2);
    expect(CREATE_PDF_MOCK).toHaveBeenCalledTimes(2);
    // The signature footer is a freshly built closure per call, so the definitions are compared by content.
    expect(CREATE_PDF_MOCK).toHaveBeenCalledWith(
      expect.objectContaining({
        content: buildProtocolDocDefinition(PDF_EVENT_MOCK, PDF_ROWS_MOCK, PDF_FINISH_COUNTS_MOCK, PDF_PREVIOUS_BESTS_MOCK).content,
      }),
    );
    expect(ADD_VIRTUAL_FILE_SYSTEM_MOCK).toHaveBeenCalledWith(FONTS_MOCK.vfs);
    expect(SET_FONTS_MOCK).toHaveBeenCalledWith(FONTS_MOCK.fonts);
    expect(service.suggestedFileName(PDF_EVENT_MOCK)).toBe(EXPECTED_FILE_NAME);
  });
});

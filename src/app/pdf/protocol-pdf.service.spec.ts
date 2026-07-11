import { TestBed } from '@angular/core/testing';

import { buildEventResultsFile } from '../core/github/results-file';
import { PROTOCOL_ROWS, RACE_EVENT } from '../core/github/spec-utils/race-fixtures';
import { ResultsService } from '../github/results.service';
import { OBJECT_URL_MOCK } from './blob-download.mock';
import { PdfService } from './pdf.service';
import { ProtocolPdfService } from './protocol-pdf.service';
import { PROTOCOL_PDF_NOT_FOUND_ERROR } from './protocol-pdf.service.constant';
import { PROTOCOL_PDF_BLOB_MOCK, PROTOCOL_PDF_FILE_NAME, PROTOCOL_PDF_SLUG } from './protocol-pdf.service.mock';

describe('ProtocolPdfService', () => {
  const loadResults = vi.fn();
  const generateProtocolBlob = vi.fn();
  const suggestedFileName = vi.fn();

  let service: ProtocolPdfService;
  let downloadName: string;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    downloadName = '';
    generateProtocolBlob.mockResolvedValue(PROTOCOL_PDF_BLOB_MOCK);
    suggestedFileName.mockReturnValue(PROTOCOL_PDF_FILE_NAME);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue(OBJECT_URL_MOCK);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloadName = this.download;
    });
    TestBed.configureTestingModule({
      providers: [
        { provide: ResultsService, useValue: { loadResults } },
        { provide: PdfService, useValue: { generateProtocolBlob, suggestedFileName } },
      ],
    });
    service = TestBed.inject(ProtocolPdfService);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('generates the pdf from the published results and saves it under the suggested name', async () => {
    const file = buildEventResultsFile(RACE_EVENT, PROTOCOL_ROWS);

    loadResults.mockResolvedValue(file);

    await service.download(PROTOCOL_PDF_SLUG);

    expect(loadResults).toHaveBeenCalledExactlyOnceWith(PROTOCOL_PDF_SLUG);
    expect(generateProtocolBlob).toHaveBeenCalledExactlyOnceWith(file.event, file.rows);
    expect(suggestedFileName).toHaveBeenCalledExactlyOnceWith(file.event);
    expect(URL.createObjectURL).toHaveBeenCalledExactlyOnceWith(PROTOCOL_PDF_BLOB_MOCK);
    expect(downloadName, 'the saved file carries the suggested name').toBe(PROTOCOL_PDF_FILE_NAME);
  });

  it('rejects without generating anything when the event was never published', async () => {
    loadResults.mockResolvedValue(null);

    await expect(service.download(PROTOCOL_PDF_SLUG)).rejects.toThrow(PROTOCOL_PDF_NOT_FOUND_ERROR);
    expect(generateProtocolBlob).not.toHaveBeenCalled();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});

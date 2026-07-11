import { DOCUMENT, Injectable, inject } from '@angular/core';

import { ResultsService } from '../github/results.service';
import { triggerBlobDownload } from './blob-download';
import { PdfService } from './pdf.service';
import { PROTOCOL_PDF_NOT_FOUND_ERROR } from './protocol-pdf.service.constant';

/**
 * Builds and downloads a published event's protocol PDF on demand, entirely in the browser: the
 * event's `results.json` feeds the same pdfmake pipeline used at publish time, so the file is
 * always in sync with the stored data and nothing has to be pre-rendered or hosted in the repo.
 */
@Injectable({ providedIn: 'root' })
export class ProtocolPdfService {
  readonly #results = inject(ResultsService);
  readonly #pdf = inject(PdfService);
  readonly #document = inject(DOCUMENT);

  /** Generates the protocol PDF for `slug` and saves it; rejects when the event is not published. */
  async download(slug: string): Promise<void> {
    const file = await this.#results.loadResults(slug);

    if (file === null) {
      throw new Error(PROTOCOL_PDF_NOT_FOUND_ERROR);
    }

    const blob = await this.#pdf.generateProtocolBlob(file.event, file.rows);

    triggerBlobDownload(this.#document, blob, this.#pdf.suggestedFileName(file.event));
  }
}

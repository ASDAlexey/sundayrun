import { DOCUMENT, Injectable, inject } from '@angular/core';

import { finishCountsAt } from '../core/history/finish-counts';
import { buildPreviousBests } from '../core/history/previous-bests';
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
    const [file, participantRuns] = await Promise.all([
      this.#results.loadResults(slug),
      // The runs are garnish: a failed read blanks the «Участий» column and the «ЛР» dates, never the PDF.
      this.#results.loadParticipantRuns(slug).catch(() => []),
    ]);

    if (file === null) {
      throw new Error(PROTOCOL_PDF_NOT_FOUND_ERROR);
    }

    const blob = await this.#pdf.generateProtocolBlob(
      file.event,
      file.rows,
      finishCountsAt(participantRuns, file.event.dateIso),
      buildPreviousBests(participantRuns, file.event.dateIso),
    );

    triggerBlobDownload(this.#document, blob, this.#pdf.suggestedFileName(file.event));
  }
}

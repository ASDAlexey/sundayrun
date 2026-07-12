import { Injectable, inject } from '@angular/core';

import type { PdfMakeStatic } from 'pdfmake/build/pdfmake';

import { ProtocolRow } from '../core/models/protocol-row.interface';
import { RaceEvent } from '../core/models/race-event.interface';
import { buildProtocolDocDefinition } from '../core/pdf/protocol-doc-definition';
import { PdfFontsService } from './pdf-fonts.service';
import { PDF_FILE_EXTENSION, PROTOCOL_FILE_PREFIX } from './pdf.service.constant';

/** Renders the race protocol into a PDF blob through a lazily imported pdfmake. */
@Injectable({ providedIn: 'root' })
export class PdfService {
  readonly #fonts = inject(PdfFontsService);

  /** `finishCounts` feeds the «Финишей» column; an empty map leaves it blank. */
  async generateProtocolBlob(event: RaceEvent, rows: ProtocolRow[], finishCounts: Record<string, number>): Promise<Blob> {
    const [{ fonts, vfs }, pdfMake] = await Promise.all([this.#fonts.load(), loadPdfMake()]);
    const createdPdf = pdfMake.createPdf(buildProtocolDocDefinition(event, rows, finishCounts), undefined, fonts, vfs);

    return new Promise((resolve) => createdPdf.getBlob(resolve));
  }

  /** 'protokol-2026-06-14.pdf' straight from the event ISO date. */
  suggestedFileName(event: RaceEvent): string {
    return `${PROTOCOL_FILE_PREFIX}${event.dateIso}${PDF_FILE_EXTENSION}`;
  }
}

/** The pdfmake browser bundle is CommonJS: depending on the bundler interop it lands as the default or the namespace export. */
async function loadPdfMake(): Promise<PdfMakeStatic> {
  const pdfMakeModule = await import('pdfmake/build/pdfmake');

  return pdfMakeModule.default ?? pdfMakeModule;
}

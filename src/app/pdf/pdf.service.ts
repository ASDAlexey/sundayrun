import { Service, inject } from '@angular/core';

import type { PdfMakeStatic } from 'pdfmake/build/pdfmake';

import { RaceEvent } from '../core/models/race-event.interface';
import { buildProtocolDocDefinition } from '../core/pdf/protocol-doc-definition';
import { ProtocolDocInput } from '../core/pdf/protocol-doc-definition.interface';
import { PdfFontsService } from './pdf-fonts.service';
import { PDF_FILE_EXTENSION, PROTOCOL_FILE_PREFIX } from './pdf.service.constant';

/** Renders the race protocol into a PDF blob through a lazily imported pdfmake. */
@Service()
export class PdfService {
  readonly #fonts = inject(PdfFontsService);

  /** Everything past the event and its rows is garnish (see `ProtocolDocInput`): empty maps and a null weather degrade gracefully. */
  async generateProtocolBlob(input: ProtocolDocInput): Promise<Blob> {
    const [{ fonts, vfs }, pdfMake] = await Promise.all([this.#fonts.load(), loadPdfMake()]);

    pdfMake.addVirtualFileSystem(vfs);
    pdfMake.setFonts(fonts);

    return pdfMake.createPdf(buildProtocolDocDefinition(input)).getBlob();
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

declare module 'pdfmake/build/pdfmake' {
  import type { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';

  export interface PdfDocument {
    getBlob(callback: (blob: Blob) => void): void;
  }

  export interface PdfMakeStatic {
    createPdf(
      documentDefinition: TDocumentDefinitions,
      tableLayouts?: undefined,
      fonts?: TFontDictionary,
      vfs?: Record<string, string>,
    ): PdfDocument;
  }

  export const createPdf: PdfMakeStatic['createPdf'];

  /** The browser bundle is CommonJS: depending on the interop it lands as the default export or not at all. */
  const pdfMakeDefault: PdfMakeStatic | undefined;

  export default pdfMakeDefault;
}

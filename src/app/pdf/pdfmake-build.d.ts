declare module 'pdfmake/build/pdfmake' {
  import type { TDocumentDefinitions, TFontDictionary, TVirtualFileSystem } from 'pdfmake/interfaces';

  export interface PdfDocument {
    getBlob(): Promise<Blob>;
  }

  export interface PdfMakeStatic {
    createPdf(documentDefinition: TDocumentDefinitions): PdfDocument;
    /** Replaces the bundled Roboto dictionary: the protocol only ever renders in PT Serif. */
    setFonts(fonts: TFontDictionary): void;
    addVirtualFileSystem(vfs: TVirtualFileSystem): void;
  }

  export const createPdf: PdfMakeStatic['createPdf'];

  export const setFonts: PdfMakeStatic['setFonts'];

  export const addVirtualFileSystem: PdfMakeStatic['addVirtualFileSystem'];

  /** The browser bundle is CommonJS: depending on the interop it lands as the default export or not at all. */
  const pdfMakeDefault: PdfMakeStatic | undefined;

  export default pdfMakeDefault;
}

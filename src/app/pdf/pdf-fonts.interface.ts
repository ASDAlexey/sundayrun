import type { TFontDictionary } from 'pdfmake/interfaces';

/** The pdfmake virtual file system plus the PT Serif font descriptor built from it. */
export interface PtSerifFonts {
  vfs: Record<string, string>;
  fonts: TFontDictionary;
}

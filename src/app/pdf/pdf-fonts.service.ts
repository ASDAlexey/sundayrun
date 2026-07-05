import { Injectable } from '@angular/core';

import { loadPtSerifVfs } from './pdf-fonts';
import { PtSerifFonts } from './pdf-fonts.interface';

/** DI seam around the pure font loader: the ttf files are fetched once and cached for the session. */
@Injectable({ providedIn: 'root' })
export class PdfFontsService {
  #fontsPromise: Promise<PtSerifFonts> | null = null;

  load(): Promise<PtSerifFonts> {
    this.#fontsPromise ??= loadPtSerifVfs();

    return this.#fontsPromise;
  }
}

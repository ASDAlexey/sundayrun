import { DOCUMENT, Service, inject } from '@angular/core';

import { savePlanImage } from './plan-image';

/**
 * The card's one way out to the browser: rasterising the poster and handing it over.
 *
 * A wrapper around a plain function, and a service only so that it is replaceable. Everything
 * `savePlanImage` touches — an `Image` that decodes, a canvas with a 2D context, a share sheet —
 * is a global the test environment either lacks or has to be talked into, and stubbing all of it
 * to press one button would make the card's own tests about canvases rather than about plans.
 */
@Service()
export class PlanImageService {
  readonly #document = inject(DOCUMENT);

  save(svg: string, fileName: string): Promise<boolean> {
    return savePlanImage({ svg, fileName, document: this.#document });
  }
}

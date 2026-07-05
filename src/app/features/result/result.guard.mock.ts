import { UrlTree } from '@angular/router';

/** Sentinel returned by the mocked Router.createUrlTree. */
export const PREVIEW_URL_TREE: UrlTree = Object.create(UrlTree.prototype);

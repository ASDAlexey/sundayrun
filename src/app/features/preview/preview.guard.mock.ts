import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';

/** The guard ignores its snapshot arguments, so bare prototype instances are enough. */
export const GUARD_ROUTE_SNAPSHOT: ActivatedRouteSnapshot = Object.create(ActivatedRouteSnapshot.prototype);

export const GUARD_STATE_SNAPSHOT: RouterStateSnapshot = Object.create(RouterStateSnapshot.prototype);

/** Sentinel returned by the mocked Router.createUrlTree. */
export const UPLOAD_URL_TREE: UrlTree = Object.create(UrlTree.prototype);

import { Routes } from '@angular/router';

/** Componentless catch-all: any `navigateByUrl` succeeds without rendering an outlet. */
export function canonicalTestRoutes(): Routes {
  return [{ path: '**', children: [] }];
}

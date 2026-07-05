import { Routes } from '@angular/router';

import { adminGuard } from './features/admin/admin.guard';
import { previewGuard } from './features/preview/preview.guard';
import { resultGuard } from './features/result/result.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/races/races-page').then((module) => module.RacesPage),
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin-page').then((module) => module.AdminPage),
  },
  {
    path: 'upload',
    canActivate: [adminGuard],
    loadComponent: () => import('./features/upload/upload-page').then((module) => module.UploadPage),
  },
  {
    path: 'preview',
    canActivate: [adminGuard, previewGuard],
    loadComponent: () => import('./features/preview/preview-page').then((module) => module.PreviewPage),
  },
  {
    path: 'result',
    canActivate: [adminGuard, resultGuard],
    loadComponent: () => import('./features/result/result-page').then((module) => module.ResultPage),
  },
  {
    path: 'races/:slug',
    loadComponent: () => import('./features/race/race-page').then((module) => module.RacePage),
  },
  {
    path: 'athletes',
    loadComponent: () => import('./features/athletes/athletes-page').then((module) => module.AthletesPage),
  },
  {
    path: 'athletes/:key',
    loadComponent: () => import('./features/athlete/athlete-page').then((module) => module.AthletePage),
  },
  { path: '**', redirectTo: '' },
];

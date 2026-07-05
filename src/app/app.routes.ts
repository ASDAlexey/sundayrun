import { Routes } from '@angular/router';

import { adminGuard } from './features/admin/admin.guard';
import { previewGuard } from './features/preview/preview.guard';
import { resultGuard } from './features/result/result.guard';

export const routes: Routes = [
  {
    path: '',
    title: $localize`:@@title.races:Воскресный парковый пробег в Таганроге — протоколы и результаты`,
    loadComponent: () => import('./features/races/races-page').then((module) => module.RacesPage),
  },
  {
    path: 'admin',
    title: $localize`:@@title.admin:Вход для организатора — Воскресный парковый пробег`,
    loadComponent: () => import('./features/admin/admin-page').then((module) => module.AdminPage),
  },
  {
    path: 'upload',
    title: $localize`:@@title.upload:Загрузка забега — Воскресный парковый пробег`,
    canActivate: [adminGuard],
    loadComponent: () => import('./features/upload/upload-page').then((module) => module.UploadPage),
  },
  {
    path: 'preview',
    title: $localize`:@@title.preview:Предпросмотр протокола — Воскресный парковый пробег`,
    canActivate: [adminGuard, previewGuard],
    loadComponent: () => import('./features/preview/preview-page').then((module) => module.PreviewPage),
  },
  {
    path: 'result',
    title: $localize`:@@title.result:Публикация результата — Воскресный парковый пробег`,
    canActivate: [adminGuard, resultGuard],
    loadComponent: () => import('./features/result/result-page').then((module) => module.ResultPage),
  },
  {
    path: 'races/:slug',
    title: $localize`:@@title.race:Протокол пробега — Воскресный парковый пробег`,
    loadComponent: () => import('./features/race/race-page').then((module) => module.RacePage),
  },
  {
    path: 'athletes',
    title: $localize`:@@title.athletes:Участники — Воскресный парковый пробег`,
    loadComponent: () => import('./features/athletes/athletes-page').then((module) => module.AthletesPage),
  },
  {
    path: 'athletes/:key',
    title: $localize`:@@title.athlete:Участник — Воскресный парковый пробег`,
    loadComponent: () => import('./features/athlete/athlete-page').then((module) => module.AthletePage),
  },
  { path: '**', redirectTo: '' },
];

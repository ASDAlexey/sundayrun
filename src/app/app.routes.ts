import { Routes } from '@angular/router';

import { AdminPage } from './features/admin/admin-page';
import { AthletePage } from './features/athlete/athlete-page';
import { HomePage } from './features/home/home-page';
import { RacePage } from './features/race/race-page';
import { RecordsPage } from './features/records/records-page';
import { RacesPage } from './features/races/races-page';
import { VersusPage } from './features/versus/versus-page';
import { YearPage } from './features/year/year-page';

import { adminGuard } from './features/admin/admin.guard';
import { previewGuard } from './features/preview/preview.guard';
import { resultGuard } from './features/result/result.guard';

// Public pages are bundled eagerly: a lazy chunk would repaint the shell and shift the footer (CLS).
// The organiser wizard (upload/preview/result) stays lazy — it pulls xlsx/pdf machinery.
export const routes: Routes = [
  {
    path: '',
    title: $localize`:@@title.races:Воскресный парковый пробег в Таганроге — протоколы и результаты`,
    component: HomePage,
  },
  {
    path: 'races',
    title: $localize`:@@title.racesList:Все забеги — Воскресный парковый пробег`,
    component: RacesPage,
  },
  {
    path: 'records',
    title: $localize`:@@title.records:Лучшие результаты — Воскресный парковый пробег`,
    component: RecordsPage,
  },
  // Both flavours land on the same page: without a year it opens the newest season.
  {
    path: 'year',
    title: $localize`:@@title.year:Итоги года — Воскресный парковый пробег`,
    component: YearPage,
  },
  {
    path: 'year/:year',
    title: $localize`:@@title.year:Итоги года — Воскресный парковый пробег`,
    component: YearPage,
  },
  // The duel flavours share the page: /vs picks the pair, deeper paths preselect one or both athletes.
  {
    path: 'vs',
    title: $localize`:@@title.versus:Очные встречи — Воскресный парковый пробег`,
    component: VersusPage,
  },
  {
    path: 'vs/:left',
    title: $localize`:@@title.versus:Очные встречи — Воскресный парковый пробег`,
    component: VersusPage,
  },
  {
    path: 'vs/:left/:right',
    title: $localize`:@@title.versus:Очные встречи — Воскресный парковый пробег`,
    component: VersusPage,
  },
  {
    path: 'admin',
    title: $localize`:@@title.admin:Вход для организатора — Воскресный парковый пробег`,
    component: AdminPage,
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
    component: RacePage,
  },
  // The athletes directory merged into /records; old bookmarks land on the leaderboards.
  { path: 'athletes', redirectTo: 'records' },
  {
    path: 'athletes/:key',
    title: $localize`:@@title.athlete:Участник — Воскресный парковый пробег`,
    component: AthletePage,
  },
  { path: '**', redirectTo: '' },
];

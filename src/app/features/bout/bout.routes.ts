import { Routes } from '@angular/router';

export const boutRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/dashboard-referee/dashboard-referee.component')
      .then(m => m.DashboardRefereeComponent)
  },
  {
    path: ':id/bouts',
    loadComponent: () => import('./components/bout-list/bout-list.component')
      .then(m => m.BoutListComponent)
  },
  {
    path: ':id/poules',
    loadComponent: () => import('./components/poule-list-referee/poule-list-referee.component')
      .then(m => m.PouleListRefereeComponent)
  },
  {
    path: ':id/poules/:pouleId',
    loadComponent: () => import('./components/poule-detail-referee/poule-detail-referee.component')
      .then(m => m.PouleDetailRefereeComponent)
  },
  {
    path: ':id/score/:boutId',
    loadComponent: () => import('./components/bout-scorer/bout-scorer.component')
      .then(m => m.BoutScorerComponent)
  }
];

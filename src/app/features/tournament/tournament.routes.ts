import { Routes } from '@angular/router';

export const tournamentRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/dashboard-organizer/dashboard-organizer.component')
      .then(m => m.DashboardOrganizerComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./components/tournament-form/tournament-form.component')
      .then(m => m.TournamentFormComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./components/tournament-form/tournament-form.component')
      .then(m => m.TournamentFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/tournament-detail/tournament-detail.component')
      .then(m => m.TournamentDetailComponent)
  }
];

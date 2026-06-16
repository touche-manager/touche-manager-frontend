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
    loadComponent: () => import('./components/tournament-hub/tournament-hub.component')
      .then(m => m.TournamentHubComponent)
  },
  {
    // Legacy link — the poules view now lives inside the tournament hub
    path: ':id/poules',
    redirectTo: ':id',
    pathMatch: 'full'
  }
];

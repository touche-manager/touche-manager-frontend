import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'athlete',
    loadComponent: () => import('./features/athlete/athlete.page').then(m => m.AthletePageComponent)
  },
  {
    path: 'tournament',
    loadComponent: () => import('./features/tournament/tournament.page').then(m => m.TournamentPageComponent)
  },
  {
    path: 'bout',
    loadComponent: () => import('./features/bout/bout.page').then(m => m.BoutPageComponent)
  },
  { path: '**', redirectTo: 'auth' }
];

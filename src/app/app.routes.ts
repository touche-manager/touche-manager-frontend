import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  {
    path: 'auth',
    loadComponent: () => import('./features/auth/auth.page').then((m) => m.AuthPageComponent)
  },
  {
    path: 'athlete',
    loadComponent: () => import('./features/athlete/athlete.page').then((m) => m.AthletePageComponent)
  },
  {
    path: 'tournament',
    loadComponent: () => import('./features/tournament/tournament.page').then((m) => m.TournamentPageComponent)
  },
  {
    path: 'bout',
    loadComponent: () => import('./features/bout/bout.page').then((m) => m.BoutPageComponent)
  },
  { path: '**', redirectTo: 'auth' }
];

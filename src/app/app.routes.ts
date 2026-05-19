import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'athlete',
    loadComponent: () => import('./features/athlete/athlete.page').then(m => m.AthletePageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tournament',
    loadComponent: () => import('./features/tournament/tournament.page').then(m => m.TournamentPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'bout',
    loadComponent: () => import('./features/bout/bout.page').then(m => m.BoutPageComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'auth' }
];

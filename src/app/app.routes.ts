import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'athlete',
    loadChildren: () => import('./features/athlete/athlete.routes').then(m => m.athleteRoutes),
    canActivate: [authGuard, roleGuard(['ATHLETE', 'ADMIN'])]
  },
  {
    path: 'tournament',
    loadComponent: () => import('./features/tournament/tournament.page').then(m => m.TournamentPageComponent),
    canActivate: [authGuard, roleGuard(['ORGANIZER', 'ADMIN'])]
  },
  {
    path: 'bout',
    loadComponent: () => import('./features/bout/bout.page').then(m => m.BoutPageComponent),
    canActivate: [authGuard, roleGuard(['REFEREE', 'ADMIN'])]
  },
  { path: '**', redirectTo: 'auth' }
];

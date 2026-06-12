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
    loadChildren: () => import('./features/tournament/tournament.routes').then(m => m.tournamentRoutes),
    canActivate: [authGuard, roleGuard(['ORGANIZER', 'ADMIN'])]
  },
  {
    path: 'bout',
    loadChildren: () => import('./features/bout/bout.routes').then(m => m.boutRoutes),
    canActivate: [authGuard, roleGuard(['REFEREE', 'ADMIN'])]
  },
  {
    path: 'live/:boutId',
    loadComponent: () =>
      import('./features/spectator/live-scoreboard/live-scoreboard.page')
        .then(m => m.LiveScoreboardPageComponent)
    // No auth guard — public route for spectators
  },
  {
    path: 'results/:id',
    loadComponent: () =>
      import('./features/tournament/pages/tournament-public-detail/tournament-public-detail.page')
        .then(m => m.TournamentPublicDetailPageComponent)
    // No auth guard — public route
  },
  { path: '**', redirectTo: 'auth' }
];

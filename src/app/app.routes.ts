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
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.adminRoutes),
    canActivate: [authGuard, roleGuard(['ADMIN'])]
  },

  // ── Public routes — no auth required ────────────────────────────────────────

  {
    path: 'spectator',
    loadComponent: () =>
      import('./features/spectator/spectator-dashboard/spectator-dashboard.page')
        .then(m => m.SpectatorDashboardPageComponent)
  },
  {
    path: 'tournaments',
    loadComponent: () =>
      import('./features/tournament/pages/tournaments-public/tournaments-public.page')
        .then(m => m.TournamentsPublicPageComponent)
  },
  {
    path: 'rankings',
    loadComponent: () =>
      import('./features/athlete/rankings/rankings.page')
        .then(m => m.RankingsPageComponent)
  },
  {
    path: 'rankings/points',
    loadComponent: () =>
      import('./features/athlete/ranking-points/ranking-points.page')
        .then(m => m.RankingPointsPageComponent)
  },
  {
    path: 'results/:id',
    loadComponent: () =>
      import('./features/tournament/pages/tournament-public-detail/tournament-public-detail.page')
        .then(m => m.TournamentPublicDetailPageComponent)
  },
  {
    // Live: list of in-progress tournaments
    path: 'live',
    loadComponent: () =>
      import('./features/spectator/live-tournaments/live-tournaments.page')
        .then(m => m.LiveTournamentsPageComponent)
  },
  {
    // Live read-only view of a tournament (poules, standings, bracket)
    path: 'live/tournament/:id',
    loadComponent: () =>
      import('./features/spectator/live-tournament/live-tournament.page')
        .then(m => m.LiveTournamentPageComponent)
  },
  {
    // Live scoreboard for a specific bout
    path: 'live/bout/:boutId',
    loadComponent: () =>
      import('./features/spectator/live-scoreboard/live-scoreboard.page')
        .then(m => m.LiveScoreboardPageComponent)
  },
  {
    // Legacy redirect — keep old /live/:boutId links working
    path: 'live/:boutId',
    redirectTo: 'live/bout/:boutId',
    pathMatch: 'full'
  },
  { path: '**', redirectTo: 'auth' }
];

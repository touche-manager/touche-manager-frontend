import { Routes } from '@angular/router';

export const athleteRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPageComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./athlete.page').then(m => m.AthletePageComponent)
  }
];

import { Routes } from '@angular/router';

export const athleteRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPageComponent)
  },
  {
    path: 'profile',
    loadComponent: () => import('./athlete.page').then(m => m.AthletePageComponent)
  },
  {
    path: 'enrollments',
    loadComponent: () => import('./enrollments/enrollments.page').then(m => m.EnrollmentsPageComponent)
  },
  {
    path: 'enrollments/pay',
    loadComponent: () => import('./enrollments/payment-simulator/payment-simulator.page').then(m => m.PaymentSimulatorPageComponent)
  }
];

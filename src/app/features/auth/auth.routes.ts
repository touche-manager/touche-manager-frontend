import { Routes } from '@angular/router';

export const authRoutes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'select-role',
    loadComponent: () => import('./select-role/select-role.component').then(m => m.SelectRoleComponent)
  }
];

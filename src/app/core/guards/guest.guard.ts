import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NombreRol } from '../models/auth.models';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const activeRole = authService.currentRol();
    if (activeRole) {
      // If already authenticated and holding an active role, redirect to their default dashboard
      return router.createUrlTree([getDefaultRouteForRole(activeRole)]);
    }
  }

  return true;
};

function getDefaultRouteForRole(rol: NombreRol): string {
  switch (rol) {
    case 'ATLETA':      return '/athlete';
    case 'ORGANIZADOR': return '/tournament';
    case 'ARBITRO':     return '/bout';
    case 'ADMIN':       return '/tournament';
    default:            return '/auth/login';
  }
}

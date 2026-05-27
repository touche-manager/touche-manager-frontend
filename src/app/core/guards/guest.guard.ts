import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleName } from '../models/auth.models';

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

function getDefaultRouteForRole(role: RoleName): string {
  switch (role) {
    case 'ATHLETE':   return '/athlete';
    case 'ORGANIZER': return '/tournament';
    case 'REFEREE':   return '/bout';
    case 'ADMIN':     return '/tournament';
    default:          return '/auth/login';
  }
}

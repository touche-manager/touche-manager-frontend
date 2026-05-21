import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NombreRol } from '../models/auth.models';

export const roleGuard = (allowedRoles: NombreRol[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/auth/login']);
    }

    const activeRole = authService.currentRol();
    if (!activeRole) {
      return router.createUrlTree(['/auth/select-role']);
    }

    if (allowedRoles.includes(activeRole)) {
      return true;
    }

    // Automatic redirection depending on role
    return router.createUrlTree([getDefaultRouteForRole(activeRole)]);
  };
};

function getDefaultRouteForRole(rol: NombreRol): string {
  switch (rol) {
    case 'ATLETA': return '/athlete';
    case 'ORGANIZADOR': return '/tournament';
    case 'ARBITRO': return '/bout';
    case 'ADMIN': return '/tournament';
    default: return '/auth/login';
  }
}

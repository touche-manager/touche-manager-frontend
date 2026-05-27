import { Component, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RoleName } from '../../../core/models/auth.models';

const ROLE_LABELS: Record<RoleName, string> = {
  ATHLETE:  'Atleta',
  REFEREE:  'Árbitro',
  ORGANIZER:'Organizador',
  ADMIN:    'Administrador'
};

const ROLE_DESCRIPTIONS: Record<RoleName, string> = {
  ATHLETE:  'Gestiona tu perfil y documentos',
  REFEREE:  'Puntúa asaltos en tiempo real',
  ORGANIZER:'Crea y gestiona torneos',
  ADMIN:    'Administración total del sistema'
};

@Component({
  selector: 'app-select-role',
  standalone: true,
  imports: [],
  templateUrl: './select-role.component.html'
})
export class SelectRoleComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly roles = computed(() => {
    const pending = this.authService.pendingRoles();
    if (pending && pending.length > 0) {
      return pending;
    }
    return this.authService.roles();
  });
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly roleLabels = ROLE_LABELS;
  readonly roleDescriptions = ROLE_DESCRIPTIONS;

  constructor() {
    // Redirect to login if not authenticated or no roles available
    if (!this.authService.isAuthenticated() || this.roles().length === 0) {
      this.router.navigate(['/auth/login']);
    }
  }

  selectRole(role: RoleName): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.selectRole({ role }).subscribe({
      next: () => this.navigateToDashboard(role),
      error: (err) => {
        const msg: string = err.error?.message ?? 'No se pudo seleccionar el rol. Por favor intenta de nuevo.';
        this.errorMessage.set(msg);
        this.loading.set(false);
      }
    });
  }

  private navigateToDashboard(role: RoleName): void {
    switch (role) {
      case 'ATHLETE':   this.router.navigate(['/athlete'], { replaceUrl: true }); break;
      case 'REFEREE':   this.router.navigate(['/bout'], { replaceUrl: true }); break;
      case 'ORGANIZER': this.router.navigate(['/tournament'], { replaceUrl: true }); break;
      case 'ADMIN':     this.router.navigate(['/tournament'], { replaceUrl: true }); break;
    }
  }
}

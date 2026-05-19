import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NombreRol } from '../../../core/models/auth.models';

const ROLE_LABELS: Record<NombreRol, string> = {
  ATLETA: 'Athlete',
  ARBITRO: 'Referee',
  ORGANIZADOR: 'Organizer',
  ADMIN: 'Administrator'
};

const ROLE_DESCRIPTIONS: Record<NombreRol, string> = {
  ATLETA: 'Manage your profile and documents',
  ARBITRO: 'Score bouts in real time',
  ORGANIZADOR: 'Create and manage tournaments',
  ADMIN: 'Full system administration'
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

  readonly roles = this.authService.pendingRoles;
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly roleLabels = ROLE_LABELS;
  readonly roleDescriptions = ROLE_DESCRIPTIONS;

  constructor() {
    // Redirect to login if arrived here without pending roles
    if (!this.authService.pendingRoles()) {
      this.router.navigate(['/auth/login']);
    }
  }

  selectRole(rol: NombreRol): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authService.selectRole({ rol }).subscribe({
      next: () => this.navigateToDashboard(rol),
      error: (err) => {
        const msg: string = err.error?.message ?? 'Could not select role. Please try again.';
        this.errorMessage.set(msg);
        this.loading.set(false);
      }
    });
  }

  private navigateToDashboard(rol: NombreRol): void {
    switch (rol) {
      case 'ATLETA':      this.router.navigate(['/athlete']); break;
      case 'ARBITRO':     this.router.navigate(['/bout']); break;
      case 'ORGANIZADOR': this.router.navigate(['/tournament']); break;
      case 'ADMIN':       this.router.navigate(['/tournament']); break;
    }
  }
}

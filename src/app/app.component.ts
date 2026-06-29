import { Component, effect, inject, signal, untracked } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { RoleName } from './core/models/auth.models';
import { environment } from '../environments/environment';
import { NotificationBellComponent } from './shared/components/notification-bell/notification-bell.component';
import { AlertService } from './shared/services/alert.service';
import { AlertModalComponent } from './shared/components/alert-modal/alert-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, NotificationBellComponent, AlertModalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alertService = inject(AlertService);

  title = 'touche-manager-frontend';

  // Expose signals to the template
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly currentRol = this.authService.currentRol;
  readonly hasMultipleRoles = this.authService.hasMultipleRoles;
  readonly profile = this.authService.profile;

  readonly showProfileModal = signal(false);
  readonly isUploading = signal(false);
  readonly isDeleting = signal(false);

  constructor() {
    effect(() => {
      if (this.isAuthenticated() && !this.profile()) {
        untracked(() => {
          this.authService.fetchProfile().subscribe({
            error: () => this.logout()
          });
        });
      }
    });
  }

  toggleProfileModal(): void {
    this.showProfileModal.update(v => !v);
  }

  getUserInitial(): string {
    const email = this.profile()?.email || '';
    return email ? email.charAt(0).toUpperCase() : '?';
  }

  getFullProfilePictureUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('/api') && environment.apiUrl.endsWith('/api')) {
      const baseUrl = environment.apiUrl.substring(0, environment.apiUrl.length - 4);
      return `${baseUrl}${url}`;
    }
    return `${environment.apiUrl}${url}`;
  }

  getRoleLabel(role: RoleName | null | undefined): string {
    const labels: Record<RoleName, string> = {
      ATHLETE:  'Atleta',
      REFEREE:  'Árbitro',
      ORGANIZER: 'Organizador',
      ADMIN:    'Administrador'
    };
    return role ? (labels[role] ?? role) : '';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Limit file size to 2MB (optional, but good practice)
      if (file.size > 2 * 1024 * 1024) {
        this.alertService.error('Error de archivo', 'La foto de perfil no debe superar los 2MB.');
        return;
      }

      // Check format
      if (!file.type.startsWith('image/')) {
        this.alertService.error('Formato inválido', 'El archivo seleccionado debe ser una imagen (PNG o JPG).');
        return;
      }

      this.isUploading.set(true);
      this.authService.uploadProfilePicture(file).subscribe({
        next: () => {
          this.isUploading.set(false);
          this.alertService.success('Foto actualizada', 'Tu foto de perfil se actualizó correctamente.');
        },
        error: (err) => {
          this.isUploading.set(false);
          console.error('Error al subir la imagen', err);
          this.alertService.error('Error al subir', 'Hubo un error al subir tu foto de perfil. Intentá de nuevo.');
        }
      });
    }
  }

  async onDeletePicture(): Promise<void> {
    const confirmed = await this.alertService.confirm(
      '¿Eliminar foto de perfil?',
      'Esta acción quitará tu foto actual y volverá a mostrar tus iniciales. ¿Querés continuar?',
      true // isDestructive = true
    );
    
    if (confirmed) {
      this.isDeleting.set(true);
      this.authService.deleteProfilePicture().subscribe({
        next: () => {
          this.isDeleting.set(false);
          this.alertService.success('Foto eliminada', 'Tu foto de perfil se eliminó correctamente.');
        },
        error: (err) => {
          this.isDeleting.set(false);
          console.error('Error al eliminar la imagen', err);
          this.alertService.error('Error al eliminar', 'Hubo un error al eliminar tu foto de perfil.');
        }
      });
    }
  }

  changeRole(): void {
    this.router.navigate(['/auth/select-role']);
  }

  logout(): void {
    this.showProfileModal.set(false);
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  showLoginButton(): boolean {
    return !this.isAuthenticated() && !this.router.url.startsWith('/auth');
  }
}

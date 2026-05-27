import { Component, effect, inject, signal, untracked } from '@angular/core';
import { Router,RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Limit file size to 2MB (optional, but good practice)
      if (file.size > 2 * 1024 * 1024) {
        alert('La imagen no debe superar los 2MB');
        return;
      }

      // Check format
      if (!file.type.startsWith('image/')) {
        alert('El archivo seleccionado debe ser una imagen');
        return;
      }

      this.isUploading.set(true);
      this.authService.uploadProfilePicture(file).subscribe({
        next: () => {
          this.isUploading.set(false);
        },
        error: (err) => {
          this.isUploading.set(false);
          console.error('Error al subir la imagen', err);
          alert('Hubo un error al subir la foto de perfil. Intente nuevamente.');
        }
      });
    }
  }

  onDeletePicture(): void {
    if (confirm('¿Está seguro de que desea eliminar su foto de perfil?')) {
      this.isDeleting.set(true);
      this.authService.deleteProfilePicture().subscribe({
        next: () => {
          this.isDeleting.set(false);
        },
        error: (err) => {
          this.isDeleting.set(false);
          console.error('Error al eliminar la imagen', err);
          alert('Hubo un error al eliminar la foto de perfil.');
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
}

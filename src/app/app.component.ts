import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
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

  changeRole(): void {
    this.router.navigate(['/auth/select-role']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}

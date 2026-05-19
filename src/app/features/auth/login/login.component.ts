import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: (res) => {
        if (res.roles && res.roles.length > 0) {
          // Multiple roles → go to select-role screen
          this.router.navigate(['/auth/select-role']);
        } else {
          // Single role — token already stored by auth.service
          this.navigateToDashboard();
        }
      },
      error: (err) => {
        const msg: string = err.error?.message ?? 'Invalid email or password.';
        this.errorMessage.set(msg);
        this.loading.set(false);
      }
    });
  }

  private navigateToDashboard(): void {
    const rol = this.authService.currentRol();
    switch (rol) {
      case 'ATLETA':      this.router.navigate(['/athlete']); break;
      case 'ARBITRO':     this.router.navigate(['/bout']); break;
      case 'ORGANIZADOR': this.router.navigate(['/tournament']); break;
      case 'ADMIN':       this.router.navigate(['/tournament']); break;
      default:            this.router.navigate(['/auth/login']);
    }
  }
}

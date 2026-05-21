import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { NgClass } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { NombreRol } from '../../../core/models/auth.models';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('confirmPassword');
  if (!password || !confirm) return null;
  return password.value === confirm.value ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, NgClass],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly availableRoles: { label: string; value: NombreRol }[] = [
    { label: 'Atleta', value: 'ATLETA' },
    { label: 'Árbitro', value: 'ARBITRO' },
    { label: 'Organizador', value: 'ORGANIZADOR' }
  ];

  readonly form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      roles: this.fb.array(this.availableRoles.map(() => this.fb.control(false)))
    },
    { validators: passwordsMatchValidator }
  );

  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showConfirm = signal(false);

  get rolesArray(): FormArray {
    return this.form.get('roles') as FormArray;
  }

  get selectedRoles(): NombreRol[] {
    return this.availableRoles
      .filter((_, i) => this.rolesArray.at(i).value)
      .map(r => r.value);
  }

  get passwordsMismatch(): boolean {
    return this.form.hasError('passwordsMismatch') &&
      !!this.form.get('confirmPassword')?.touched;
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.selectedRoles.length === 0) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.form.value;

    this.authService.register({
      email: email!,
      password: password!,
      roles: this.selectedRoles
    }).subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: (err) => {
        const msg: string = err.error?.message ?? 'Error al registrarse. Intente nuevamente.';
        this.errorMessage.set(msg);
        this.loading.set(false);
      }
    });
  }
}

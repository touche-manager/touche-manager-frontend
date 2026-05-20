import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AthleteService } from './services/athlete.service';
import { AthleteRequest } from '../../core/models/athlete.models';

@Component({
  selector: 'app-athlete-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './athlete.page.html',
  styleUrl: './athlete.page.css'
})
export class AthletePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly athleteService = inject(AthleteService);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);

  athleteForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadProfile();
  }

  private initForm(): void {
    this.athleteForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      dni: ['', [Validators.required, Validators.pattern(/^[0-9]{7,10}$/)]],
      birthDate: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      dominantHand: ['', [Validators.required]],
      club: ['', [Validators.required]],
      province: ['', [Validators.required]]
    });
  }

  private loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);

    this.athleteService.getProfile().subscribe({
      next: (profile) => {
        this.isEditMode.set(true);
        this.athleteForm.patchValue(profile);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) {
          // Profile not found - this is expected if user hasn't created one yet
          this.isEditMode.set(false);
        } else {
          this.error.set(err.error?.message || 'Error al cargar el perfil de atleta.');
        }
      }
    });
  }

  onSubmit(): void {
    if (this.athleteForm.invalid) {
      this.athleteForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    const requestData: AthleteRequest = this.athleteForm.value;

    const request$ = this.isEditMode()
      ? this.athleteService.updateProfile(requestData)
      : this.athleteService.createProfile(requestData);

    request$.subscribe({
      next: (profile) => {
        this.success.set(true);
        this.isEditMode.set(true);
        this.athleteForm.patchValue(profile);
        this.loading.set(false);
        // Clear success message after 5 seconds
        setTimeout(() => this.success.set(false), 5000);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Ocurrió un error al guardar el perfil.');
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.athleteForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}

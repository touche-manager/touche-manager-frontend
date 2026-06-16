import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrganizerTournamentService } from '../../services/organizer-tournament.service';
import { TournamentRequest } from '../../../../core/models/tournament.models';
import { WEAPON_OPTIONS, CATEGORY_OPTIONS, GENDER_OPTIONS } from '../../../../shared/utils/filter-options';

@Component({
  selector: 'app-tournament-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tournament-form.component.html',
  styleUrls: ['./tournament-form.component.css']
})
export class TournamentFormComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly tournamentService = inject(OrganizerTournamentService);

  readonly isEditMode = signal(false);
  readonly submitting = signal(false);
  readonly errorMsg = signal<string | null>(null);
  private tournamentId: number | null = null;

  readonly weaponEntries   = WEAPON_OPTIONS;
  readonly categoryEntries = CATEGORY_OPTIONS;
  readonly genderEntries   = GENDER_OPTIONS;

  /** Today as YYYY-MM-DD, used as the min date and to validate against past dates */
  readonly today = new Date().toISOString().split('T')[0];

  /** Fields that can only be set at creation time and are locked when editing */
  private static readonly IMMUTABLE_FIELDS = ['weapon', 'category', 'gender', 'basePrice', 'isNational'];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    weapon: ['', Validators.required],
    category: ['', Validators.required],
    gender: ['', Validators.required],
    location: ['', Validators.required],
    date: ['', [Validators.required, TournamentFormComponent.notPastDate]],
    basePrice: [0, [Validators.required, Validators.min(0)]],
    isNational: [false]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.tournamentId = +id;
      this.isEditMode.set(true);
      // After creation only name/location/date can change; lock the rest.
      TournamentFormComponent.IMMUTABLE_FIELDS.forEach(f => this.form.get(f)?.disable());
      this.loadTournament();
    }
  }

  /** Rejects dates earlier than today (tournaments can't be scheduled in the past) */
  private static notPastDate(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(control.value + 'T00:00:00');
    return selected < today ? { pastDate: true } : null;
  }

  loadTournament(): void {
    if (!this.tournamentId) return;
    this.tournamentService.getTournamentById(this.tournamentId).subscribe({
      next: (t) => {
        this.form.patchValue({
          name: t.name,
          weapon: t.weapon,
          category: t.category,
          gender: t.gender,
          location: t.location,
          date: t.date,
          basePrice: t.basePrice,
          isNational: t.isNational ?? false
        });
      },
      error: () => this.errorMsg.set('Error al cargar los datos del torneo.')
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.errorMsg.set(null);

    const raw = this.form.getRawValue();
    const request: TournamentRequest = {
      name: raw.name!,
      weapon: raw.weapon as TournamentRequest['weapon'],
      category: raw.category as TournamentRequest['category'],
      gender: raw.gender as TournamentRequest['gender'],
      location: raw.location!,
      date: raw.date!,
      basePrice: Number(raw.basePrice),
      isNational: Boolean(raw.isNational)
    };

    const op = this.isEditMode() && this.tournamentId
      ? this.tournamentService.updateTournament(this.tournamentId, request)
      : this.tournamentService.createTournament(request);

    op.subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/tournament']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Error al guardar el torneo. Intente nuevamente.');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/tournament']);
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { OrganizerTournamentService } from '../../services/organizer-tournament.service';
import { TournamentRequest, OrganizerTournamentResponse } from '../../../../core/models/tournament.models';
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

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    weapon: ['', Validators.required],
    category: ['', Validators.required],
    gender: ['', Validators.required],
    location: ['', Validators.required],
    date: ['', Validators.required],
    basePrice: [0, [Validators.required, Validators.min(0)]],
    isNational: [false]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.tournamentId = +id;
      this.isEditMode.set(true);
      this.loadTournament();
    }
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
          isNational: (t as OrganizerTournamentResponse & { isNational?: boolean }).isNational ?? false
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

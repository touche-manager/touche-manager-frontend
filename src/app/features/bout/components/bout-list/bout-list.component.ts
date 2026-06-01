import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { BoutService } from '../../services/bout.service';
import { OrganizerTournamentService } from '../../../tournament/services/organizer-tournament.service';
import {
  BoutResponse, BoutRequest, BoutFormatLabels, BoutStatusLabels, BoutStatus
} from '../../../../core/models/bout.models';
import { EnrollmentDetailResponse } from '../../../../core/models/tournament.models';

@Component({
  selector: 'app-bout-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-touche-navy p-4 md:p-8">
      <div class="max-w-5xl mx-auto">

        <!-- Header -->
        <div class="flex items-center gap-4 mb-8">
          <button (click)="goBack()" class="text-touche-celeste hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-white">Asaltos del Torneo</h1>
            <p class="text-touche-celeste/70 text-sm">Creá y gestioná combates</p>
          </div>
          <button
            id="btn-new-bout"
            (click)="showNewBoutForm.set(!showNewBoutForm())"
            class="flex items-center gap-2 bg-touche-gold hover:bg-yellow-500 text-touche-navy font-bold py-2.5 px-5 rounded-xl transition-all duration-200 text-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo Asalto
          </button>
        </div>

        <!-- New bout form -->
        @if (showNewBoutForm()) {
          <div class="bg-white/5 border border-touche-celeste/30 rounded-2xl p-6 mb-6 space-y-4">
            <h3 class="font-bold text-white text-lg">Crear Asalto</h3>
            <form [formGroup]="boutForm" (ngSubmit)="createBout()">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm text-white/70 mb-1">Esgrimista Izquierda (Rojo)</label>
                  <select id="select-left" formControlName="athleteLeftId"
                    class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-touche-celeste text-sm appearance-none">
                    <option value="" class="bg-touche-navy" disabled>Seleccionar atleta...</option>
                    @for (e of enrollments(); track e.enrollmentId) {
                      <option [value]="e.athlete.id" class="bg-touche-navy">
                        {{ e.athlete.firstName }} {{ e.athlete.lastName }}
                      </option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-sm text-white/70 mb-1">Esgrimista Derecha (Verde)</label>
                  <select id="select-right" formControlName="athleteRightId"
                    class="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-touche-celeste text-sm appearance-none">
                    <option value="" class="bg-touche-navy" disabled>Seleccionar atleta...</option>
                    @for (e of enrollments(); track e.enrollmentId) {
                      <option [value]="e.athlete.id" class="bg-touche-navy">
                        {{ e.athlete.firstName }} {{ e.athlete.lastName }}
                      </option>
                    }
                  </select>
                </div>
              </div>
              <div class="mb-4">
                <label class="block text-sm text-white/70 mb-1">Formato</label>
                <div class="flex gap-3">
                  @for (f of formatOptions; track f.value) {
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input type="radio" formControlName="format" [value]="f.value"
                        class="accent-touche-celeste w-4 h-4" />
                      <span class="text-sm text-white/80">{{ f.label }}</span>
                    </label>
                  }
                </div>
              </div>
              @if (createError()) {
                <p class="text-red-400 text-sm mb-3">{{ createError() }}</p>
              }
              <div class="flex gap-3 justify-end">
                <button type="button" (click)="showNewBoutForm.set(false)"
                  class="py-2 px-5 rounded-xl border border-white/20 text-white/60 hover:text-white text-sm transition-colors">
                  Cancelar
                </button>
                <button id="btn-create-bout" type="submit" [disabled]="boutForm.invalid || creating()"
                  class="py-2 px-5 rounded-xl bg-touche-celeste hover:bg-blue-400 text-touche-navy font-bold text-sm transition-all disabled:opacity-50">
                  {{ creating() ? 'Creando...' : 'Crear' }}
                </button>
              </div>
            </form>
          </div>
        }

        <!-- Loading -->
        @if (loading()) {
          <div class="flex justify-center items-center h-48">
            <div class="animate-spin rounded-full h-10 w-10 border-4 border-touche-celeste border-t-transparent"></div>
          </div>
        }

        <!-- Bout list -->
        @if (!loading()) {
          @if (bouts().length === 0) {
            <div class="text-center py-16 text-white/40">
              <p class="text-lg">Sin asaltos registrados</p>
              <p class="text-sm mt-1">Creá el primer asalto usando el botón de arriba</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (bout of bouts(); track bout.id) {
                <div class="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div class="flex items-center gap-4">
                    <div class="flex flex-col items-center w-24">
                      <span class="text-xs text-white/40 font-medium truncate w-full text-center">{{ bout.athleteLeft.firstName }} {{ bout.athleteLeft.lastName }}</span>
                      <span class="text-3xl font-black text-white mt-1">{{ bout.scoreLeft }}</span>
                    </div>
                    <div class="flex flex-col items-center gap-1">
                      <span class="text-white/20 text-2xl font-bold">vs</span>
                      <span class="text-xs px-2 py-0.5 rounded-full" [class]="statusBadgeClass(bout.status)">
                        {{ statusLabel(bout.status) }}
                      </span>
                      <span class="text-xs text-white/40">{{ formatLabel(bout.format) }}</span>
                    </div>
                    <div class="flex flex-col items-center w-24">
                      <span class="text-xs text-white/40 font-medium truncate w-full text-center">{{ bout.athleteRight.firstName }} {{ bout.athleteRight.lastName }}</span>
                      <span class="text-3xl font-black text-white mt-1">{{ bout.scoreRight }}</span>
                    </div>
                  </div>
                  @if (bout.status !== 'FINISHED') {
                    <button
                      [id]="'btn-score-' + bout.id"
                      (click)="openScorer(bout.id)"
                      class="sm:ml-auto py-2 px-5 rounded-xl bg-touche-celeste/20 hover:bg-touche-celeste/30 text-touche-celeste font-medium text-sm transition-colors"
                    >
                      Abrir Marcador
                    </button>
                  }
                </div>
              }
            </div>
          }
        }
      </div>
    </div>
  `
})
export class BoutListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly boutService = inject(BoutService);
  private readonly tournamentService = inject(OrganizerTournamentService);
  private readonly fb = inject(FormBuilder);

  private tournamentId = 0;

  readonly bouts = signal<BoutResponse[]>([]);
  readonly enrollments = signal<EnrollmentDetailResponse[]>([]);
  readonly loading = signal(true);
  readonly showNewBoutForm = signal(false);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);

  readonly formatOptions = [
    { value: 'POULE', label: BoutFormatLabels.POULE },
    { value: 'ELIMINATION', label: BoutFormatLabels.ELIMINATION }
  ];

  readonly boutForm = this.fb.group({
    athleteLeftId: ['', Validators.required],
    athleteRightId: ['', Validators.required],
    format: ['POULE', Validators.required]
  });

  readonly statusLabel = (s: BoutStatus) => BoutStatusLabels[s] ?? s;
  readonly formatLabel = (f: string) => BoutFormatLabels[f as keyof typeof BoutFormatLabels] ?? f;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.tournamentId = id ? +id : 0;
    this.loadBouts();
    this.tournamentService.getEnrollments(this.tournamentId).subscribe({
      next: (data) => this.enrollments.set(data.filter(e => e.status === 'PAID'))
    });
  }

  loadBouts(): void {
    this.loading.set(true);
    this.boutService.getBoutsByTournament(this.tournamentId).subscribe({
      next: (data) => { this.bouts.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  createBout(): void {
    if (this.boutForm.invalid) return;
    const v = this.boutForm.getRawValue();
    const req: BoutRequest = {
      tournamentId: this.tournamentId,
      athleteLeftId: +v.athleteLeftId!,
      athleteRightId: +v.athleteRightId!,
      format: v.format as BoutRequest['format']
    };
    this.creating.set(true);
    this.createError.set(null);
    this.boutService.createBout(req).subscribe({
      next: (b) => {
        this.creating.set(false);
        this.showNewBoutForm.set(false);
        this.boutForm.reset({ format: 'POULE' });
        this.loadBouts();
      },
      error: (err) => {
        this.creating.set(false);
        this.createError.set(err?.error?.message ?? 'Error al crear el asalto.');
      }
    });
  }

  openScorer(boutId: number): void {
    this.router.navigate(['/bout', this.tournamentId, 'score', boutId]);
  }

  goBack(): void {
    this.router.navigate(['/bout']);
  }

  statusBadgeClass(status: BoutStatus): string {
    const map: Record<BoutStatus, string> = {
      PENDING: 'bg-white/10 text-white/50',
      IN_PROGRESS: 'bg-green-500/20 text-green-400',
      FINISHED: 'bg-white/10 text-touche-celeste'
    };
    return map[status] ?? '';
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  OrganizerTournamentResponse,
  WeaponLabels,
  CategoryLabels,
  RefereeApplicationResponse,
  RefereeApplicationStatus
} from '../../../../core/models/tournament.models';
import { RefereeApplicationService } from '../../../tournament/services/referee-application.service';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Component({
  selector: 'app-dashboard-referee',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-touche-navy p-4 md:p-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-2xl md:text-3xl font-bold text-white">Panel del Árbitro</h1>
        <p class="text-touche-celeste mt-1">Seleccioná un torneo para gestionar los asaltos</p>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-touche-celeste border-t-transparent"></div>
        </div>
      }

      <!-- Error -->
      @if (error()) {
        <div class="bg-red-900/30 border border-red-500/50 rounded-xl p-4 text-red-300 mb-6">
          {{ error() }}
        </div>
      }

      <!-- Tournament grid -->
      @if (!loading() && tournaments().length === 0) {
        <div class="text-center py-16 text-white/40">
          <p class="text-xl font-medium">Sin torneos disponibles</p>
          <p class="text-sm mt-2">Cuando el organizador cree torneos, aparecerán aquí</p>
        </div>
      }

      @if (!loading() && tournaments().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          @for (tournament of tournaments(); track tournament.id) {
            <div
              class="text-left bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-touche-celeste/60 hover:bg-white/8 transition-all duration-200 group flex flex-col gap-4"
            >
              <!-- Main card area (clickable to go to bouts) -->
              <button
                [id]="'btn-tournament-' + tournament.id"
                (click)="selectTournament(tournament.id)"
                class="text-left flex items-start gap-4 w-full"
              >
                <div class="w-12 h-12 rounded-xl bg-touche-celeste/20 flex items-center justify-center flex-shrink-0 group-hover:bg-touche-celeste/30 transition-colors">
                  <svg class="w-6 h-6 text-touche-celeste" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-white group-hover:text-touche-celeste transition-colors truncate">
                    {{ tournament.name }}
                  </h3>
                  <div class="flex flex-wrap gap-1.5 mt-2">
                    <span class="text-xs px-2 py-0.5 rounded-full bg-touche-celeste/20 text-touche-celeste">
                      {{ weaponLabel(tournament.weapon) }}
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                      {{ categoryLabel(tournament.category) }}
                    </span>
                  </div>
                  <p class="text-sm text-white/40 mt-2">
                    {{ formatDate(tournament.date) }} · {{ tournament.location }}
                  </p>
                  <p class="text-sm text-green-400 mt-1 font-medium">
                    {{ tournament.paidEnrollments }} inscritos
                  </p>
                </div>
                <svg class="w-5 h-5 text-white/20 group-hover:text-touche-celeste transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </button>

              <!-- Application row -->
              <div class="pt-3 border-t border-white/8 flex items-center justify-between gap-3">
                @if (!hasApplied(tournament.id)) {
                  <button
                    [id]="'btn-apply-' + tournament.id"
                    (click)="apply(tournament.id)"
                    class="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-touche-celeste/15 hover:bg-touche-celeste/25 text-touche-celeste font-medium transition-colors"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Postularme
                  </button>
                  <span class="text-xs text-white/30">Sin postulación</span>
                } @else {
                  @switch (getApplicationStatus(tournament.id)) {
                    @case ('PENDING') {
                      <span class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 text-white/60">
                        <span class="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                        Postulación enviada
                      </span>
                    }
                    @case ('ACCEPTED') {
                      <span class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-green-500/15 text-green-400">
                        <span class="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                        Aceptado — esperá la asignación de poule
                      </span>
                    }
                    @case ('REJECTED') {
                      <span class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-red-500/15 text-red-400">
                        <span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>
                        Rechazado
                      </span>
                    }
                  }
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class DashboardRefereeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly refereeApplicationService = inject(RefereeApplicationService);

  readonly tournaments = signal<OrganizerTournamentResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly myApplications = signal<RefereeApplicationResponse[]>([]);

  readonly weaponLabel = (w: string) => WeaponLabels[w as keyof typeof WeaponLabels] ?? w;
  readonly categoryLabel = (c: string) => CategoryLabels[c as keyof typeof CategoryLabels] ?? c;

  ngOnInit(): void {
    this.http.get<ApiResponse<OrganizerTournamentResponse[]>>(`${environment.apiUrl}/bouts/tournaments`)
      .pipe(map(r => r.data))
      .subscribe({
        next: (data) => { this.tournaments.set(data); this.loading.set(false); },
        error: () => { this.error.set('Error al cargar los torneos.'); this.loading.set(false); }
      });

    this.refereeApplicationService.getMyApplications().subscribe({
      next: (apps) => this.myApplications.set(apps),
      error: () => { /* silent – not critical */ }
    });
  }

  hasApplied(tournamentId: number): boolean {
    return this.myApplications().some(a => a.tournamentId === tournamentId);
  }

  getApplicationStatus(tournamentId: number): RefereeApplicationStatus | null {
    const app = this.myApplications().find(a => a.tournamentId === tournamentId);
    return app?.status ?? null;
  }

  apply(tournamentId: number): void {
    this.refereeApplicationService.apply(tournamentId).subscribe({
      next: (app) => this.myApplications.update(apps => [...apps, app]),
      error: () => this.error.set('No se pudo enviar la postulación. Intentá de nuevo.')
    });
  }

  selectTournament(id: number): void {
    this.router.navigate(['/bout', id, 'bouts']);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { OrganizerTournamentResponse, WeaponLabels, CategoryLabels } from '../../../../core/models/tournament.models';

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
            <button
              [id]="'btn-tournament-' + tournament.id"
              (click)="selectTournament(tournament.id)"
              class="text-left bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-touche-celeste/60 hover:bg-white/8 transition-all duration-200 group"
            >
              <div class="flex items-start gap-4">
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
              </div>
            </button>
          }
        </div>
      }
    </div>
  `
})
export class DashboardRefereeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly tournaments = signal<OrganizerTournamentResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly weaponLabel = (w: string) => WeaponLabels[w as keyof typeof WeaponLabels] ?? w;
  readonly categoryLabel = (c: string) => CategoryLabels[c as keyof typeof CategoryLabels] ?? c;

  ngOnInit(): void {
    this.http.get<ApiResponse<OrganizerTournamentResponse[]>>(`${environment.apiUrl}/bouts/tournaments`)
      .pipe(map(r => r.data))
      .subscribe({
        next: (data) => { this.tournaments.set(data); this.loading.set(false); },
        error: () => { this.error.set('Error al cargar los torneos.'); this.loading.set(false); }
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

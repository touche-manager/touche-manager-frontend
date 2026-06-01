import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrganizerTournamentService } from '../../services/organizer-tournament.service';
import { OrganizerTournamentResponse, WeaponLabels, CategoryLabels, GenderLabels } from '../../../../core/models/tournament.models';

@Component({
  selector: 'app-dashboard-organizer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-touche-navy p-4 md:p-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-white">Mis Torneos</h1>
          <p class="text-touche-celeste mt-1">Gestioná tus torneos y sus inscriptos</p>
        </div>
        <button
          id="btn-new-tournament"
          (click)="createNew()"
          class="flex items-center gap-2 bg-touche-gold hover:bg-yellow-500 text-touche-navy font-bold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Nuevo Torneo
        </button>
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

      <!-- Empty state -->
      @if (!loading() && !error() && tournaments().length === 0) {
        <div class="flex flex-col items-center justify-center h-64 text-center">
          <div class="w-20 h-20 bg-touche-celeste/10 rounded-full flex items-center justify-center mb-4">
            <svg class="w-10 h-10 text-touche-celeste" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-white mb-2">Sin torneos todavía</h3>
          <p class="text-touche-celeste/70">Creá tu primer torneo para comenzar</p>
        </div>
      }

      <!-- Tournaments grid -->
      @if (!loading() && tournaments().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          @for (tournament of tournaments(); track tournament.id) {
            <div class="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-touche-celeste/50 hover:bg-white/8 transition-all duration-200 group">
              <!-- Tournament header -->
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-bold text-white truncate group-hover:text-touche-celeste transition-colors">
                    {{ tournament.name }}
                  </h3>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-touche-celeste/20 text-touche-celeste">
                      {{ weaponLabel(tournament.weapon) }}
                    </span>
                    <span class="text-xs text-white/50">
                      {{ categoryLabel(tournament.category) }} — {{ genderLabel(tournament.gender) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Info -->
              <div class="space-y-2 mb-5">
                <div class="flex items-center gap-2 text-sm text-white/60">
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {{ tournament.location }}
                </div>
                <div class="flex items-center gap-2 text-sm text-white/60">
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  {{ formatDate(tournament.date) }}
                </div>
                <div class="flex items-center gap-2 text-sm text-touche-gold font-medium">
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <span class="mr-0.5">$</span>{{ tournament.basePrice | number:'1.0-0' }}
                </div>
              </div>

              <!-- Enrollment stats -->
              <div class="grid grid-cols-3 gap-2 mb-5 p-3 bg-white/5 rounded-xl">
                <div class="text-center">
                  <div class="text-xl font-bold text-green-400">{{ tournament.paidEnrollments }}</div>
                  <div class="text-xs text-white/40 mt-0.5">Pagos</div>
                </div>
                <div class="text-center border-x border-white/10">
                  <div class="text-xl font-bold text-yellow-400">{{ tournament.pendingEnrollments }}</div>
                  <div class="text-xs text-white/40 mt-0.5">Pendientes</div>
                </div>
                <div class="text-center">
                  <div class="text-xl font-bold text-white/40">{{ tournament.cancelledEnrollments }}</div>
                  <div class="text-xs text-white/40 mt-0.5">Cancelados</div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex gap-2">
                <button
                  [id]="'btn-view-' + tournament.id"
                  (click)="viewDetail(tournament.id)"
                  class="flex-1 text-sm py-2 px-3 rounded-lg bg-touche-celeste/20 hover:bg-touche-celeste/30 text-touche-celeste transition-colors font-medium"
                >
                  Inscriptos
                </button>
                <button
                  [id]="'btn-edit-' + tournament.id"
                  (click)="editTournament(tournament.id)"
                  class="flex-1 text-sm py-2 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors font-medium"
                >
                  Editar
                </button>
                <button
                  [id]="'btn-delete-' + tournament.id"
                  (click)="deleteTournament(tournament)"
                  class="text-sm py-2 px-3 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class DashboardOrganizerComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly tournamentService = inject(OrganizerTournamentService);

  readonly tournaments = signal<OrganizerTournamentResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly weaponLabel = (w: string) => WeaponLabels[w as keyof typeof WeaponLabels] ?? w;
  readonly categoryLabel = (c: string) => CategoryLabels[c as keyof typeof CategoryLabels] ?? c;
  readonly genderLabel = (g: string) => GenderLabels[g as keyof typeof GenderLabels] ?? g;

  ngOnInit(): void {
    this.loadTournaments();
  }

  loadTournaments(): void {
    this.loading.set(true);
    this.error.set(null);
    this.tournamentService.getMyTournaments().subscribe({
      next: (data) => {
        this.tournaments.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error al cargar los torneos. Intente nuevamente.');
        this.loading.set(false);
      }
    });
  }

  createNew(): void {
    this.router.navigate(['/tournament/new']);
  }

  editTournament(id: number): void {
    this.router.navigate(['/tournament', id, 'edit']);
  }

  viewDetail(id: number): void {
    this.router.navigate(['/tournament', id]);
  }

  deleteTournament(tournament: OrganizerTournamentResponse): void {
    if (!confirm(`¿Eliminar el torneo "${tournament.name}"? Esta acción no se puede deshacer.`)) return;

    this.tournamentService.deleteTournament(tournament.id).subscribe({
      next: () => this.loadTournaments(),
      error: () => alert('Error al eliminar el torneo. Intente nuevamente.')
    });
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }
}


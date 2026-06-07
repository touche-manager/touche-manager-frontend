import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RefereeApplicationService } from '../../services/referee-application.service';
import {
  RefereeApplicationResponse,
  RefereeApplicationStatus,
  RefereeApplicationStatusLabels
} from '../../../../core/models/tournament.models';

@Component({
  selector: 'app-referee-applications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mt-8">
      <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-touche-celeste" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        Postulaciones de Árbitros
      </h2>

      @if (loading()) {
        <div class="text-white/40 text-sm py-4">Cargando...</div>
      }

      @if (!loading() && applications().length === 0) {
        <div class="bg-white/5 border border-white/10 rounded-xl p-6 text-center text-white/40">
          <p>Sin postulaciones recibidas todavía</p>
        </div>
      }

      @if (!loading() && applications().length > 0) {
        <div class="space-y-3">
          @for (app of applications(); track app.id) {
            <div class="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p class="font-medium text-white">{{ app.refereeEmail }}</p>
                <p class="text-sm text-white/50 mt-0.5">
                  Postulado {{ formatDate(app.appliedAt) }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                @if (app.status === 'PENDING') {
                  <button
                    [id]="'btn-accept-' + app.id"
                    (click)="review(app.id, 'ACCEPTED')"
                    class="text-xs py-1.5 px-3 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors font-medium"
                  >
                    Aceptar
                  </button>
                  <button
                    [id]="'btn-reject-' + app.id"
                    (click)="review(app.id, 'REJECTED')"
                    class="text-xs py-1.5 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors font-medium"
                  >
                    Rechazar
                  </button>
                } @else {
                  <span class="text-xs px-3 py-1 rounded-full" [class]="statusBadge(app.status)">
                    {{ statusLabel(app.status) }}
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class RefereeApplicationsComponent implements OnInit {
  @Input() tournamentId!: number;
  private readonly service = inject(RefereeApplicationService);

  readonly applications = signal<RefereeApplicationResponse[]>([]);
  readonly loading = signal(true);

  readonly statusLabel = (s: RefereeApplicationStatus) => RefereeApplicationStatusLabels[s] ?? s;

  ngOnInit(): void {
    this.service.getApplicationsForTournament(this.tournamentId).subscribe({
      next: (data) => { this.applications.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  review(id: number, status: RefereeApplicationStatus): void {
    this.service.review(id, status).subscribe({
      next: (updated) => this.applications.update(apps =>
        apps.map(a => a.id === id ? updated : a)
      )
    });
  }

  statusBadge(s: RefereeApplicationStatus): string {
    return s === 'ACCEPTED' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}

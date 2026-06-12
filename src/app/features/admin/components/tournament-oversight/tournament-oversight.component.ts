import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicTournamentService } from '../../../tournament/services/public-tournament.service';
import { PublicTournamentResponse } from '../../../../core/models/tournament.models';
import { LabelPipe } from '../../../../shared/pipes/label.pipe';
import {
  TOURNAMENT_PHASE_LABELS
} from '../../../../shared/utils/label.maps';

@Component({
  selector: 'app-admin-tournament-oversight',
  standalone: true,
  imports: [CommonModule, RouterLink, LabelPipe],
  template: `
    <div class="space-y-4">

      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-touche-alert font-semibold">
          {{ error() }}
        </div>
      }

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-10 w-10 border-4 border-touche-celeste border-t-transparent"></div>
        </div>
      }

      @if (!loading() && tournaments().length === 0) {
        <div class="card text-center py-12">
          <p class="text-sm font-bold text-slate-400">No hay torneos en el sistema</p>
        </div>
      }

      @if (!loading() && tournaments().length > 0) {
        <div class="card overflow-hidden p-0">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-slate-200 bg-touche-slate">
                  <th class="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Torneo</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Disciplina</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th class="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th class="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                @for (t of tournaments(); track t.id) {
                  <tr class="border-b border-slate-100 hover:bg-touche-slate/60 transition-colors">
                    <td class="py-3 px-4">
                      <p class="font-medium text-touche-navy">{{ t.name }}</p>
                      <p class="text-xs text-slate-400 mt-0.5">{{ t.location }}</p>
                    </td>
                    <td class="py-3 px-4 hidden md:table-cell text-slate-500">
                      {{ t.weapon | label:'weapon' }} · {{ t.category | label:'category' }} · {{ t.gender | label:'gender' }}
                    </td>
                    <td class="py-3 px-4 text-slate-500">{{ t.date | date:'dd/MM/yyyy' }}</td>
                    <td class="py-3 px-4">
                      <span class="badge" [ngClass]="phaseBadgeClass(t.phase)">
                        {{ phaseLabels[t.phase] || t.phase }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-right">
                      <a [routerLink]="['/results', t.id]"
                         class="text-xs font-semibold text-touche-celeste hover:underline">
                        Ver detalle →
                      </a>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class TournamentOversightComponent implements OnInit {
  private readonly publicTournamentService = inject(PublicTournamentService);

  readonly tournaments = signal<PublicTournamentResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly phaseLabels = TOURNAMENT_PHASE_LABELS;

  ngOnInit(): void {
    this.publicTournamentService.search({}).subscribe({
      next: (data) => { this.tournaments.set(data); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar los torneos.'); this.loading.set(false); }
    });
  }

  phaseBadgeClass(phase: string): string {
    switch (phase) {
      case 'ENROLLMENT': return 'bg-blue-100 text-blue-700';
      case 'POULES_IN_PROGRESS': return 'bg-yellow-100 text-yellow-700';
      case 'ELIMINATION_IN_PROGRESS': return 'bg-orange-100 text-orange-700';
      case 'FINISHED': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-slate-100 text-slate-500';
    }
  }
}

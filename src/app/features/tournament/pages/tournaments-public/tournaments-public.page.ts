import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PublicTournamentService } from '../../services/public-tournament.service';
import {
  PublicTournamentFilters,
  PublicTournamentResponse
} from '../../../../core/models/tournament.models';
import { LabelPipe } from '../../../../shared/pipes/label.pipe';
import { TOURNAMENT_PHASE_LABELS } from '../../../../shared/utils/label.maps';

/** Public tournament listing with filters — no auth required */
@Component({
  selector: 'app-tournaments-public',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LabelPipe],
  templateUrl: './tournaments-public.page.html'
})
export class TournamentsPublicPageComponent implements OnInit {
  private readonly publicTournamentService = inject(PublicTournamentService);

  readonly tournaments = signal<PublicTournamentResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly phaseLabels = TOURNAMENT_PHASE_LABELS;

  readonly filters = signal<PublicTournamentFilters>({
    status: '', weapon: '', category: '', gender: '', dateFrom: '', dateTo: ''
  });

  ngOnInit(): void {
    this.search();
  }

  setFilter<K extends keyof PublicTournamentFilters>(key: K, value: PublicTournamentFilters[K]): void {
    this.filters.update(f => ({ ...f, [key]: value }));
    this.search();
  }

  clearFilters(): void {
    this.filters.set({ status: '', weapon: '', category: '', gender: '', dateFrom: '', dateTo: '' });
    this.search();
  }

  search(): void {
    this.loading.set(true);
    this.error.set(null);
    this.publicTournamentService.search(this.filters()).subscribe({
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

  /** Short status badge text per the spec: ENROLLMENT / EN CURSO / FINALIZADO */
  phaseShortLabel(phase: string): string {
    switch (phase) {
      case 'ENROLLMENT': return 'Inscripciones';
      case 'POULES_IN_PROGRESS':
      case 'ELIMINATION_IN_PROGRESS': return 'En curso';
      case 'FINISHED': return 'Finalizado';
      default: return phase;
    }
  }
}

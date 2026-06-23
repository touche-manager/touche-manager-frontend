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
  templateUrl: './tournament-oversight.component.html'
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

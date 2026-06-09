import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrganizerTournamentService } from '../../services/organizer-tournament.service';
import { OrganizerTournamentResponse } from '../../../../core/models/tournament.models';
import { LabelPipe } from '../../../../shared/pipes/label.pipe';
import { TournamentPhase } from '../../../../shared/utils/label.maps';

@Component({
  selector: 'app-dashboard-organizer',
  standalone: true,
  imports: [CommonModule, LabelPipe],
  templateUrl: './dashboard-organizer.component.html'
})
export class DashboardOrganizerComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly tournamentService = inject(OrganizerTournamentService);

  readonly tournaments = signal<OrganizerTournamentResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

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

  createNew(): void { this.router.navigate(['/tournament/new']); }
  editTournament(id: number): void { this.router.navigate(['/tournament', id, 'edit']); }
  viewDetail(id: number): void { this.router.navigate(['/tournament', id]); }
  viewResults(id: number): void { this.router.navigate(['/results', id]); }

  phaseBadgeClass(phase: TournamentPhase): string {
    const map: Record<TournamentPhase, string> = {
      ENROLLMENT:               'bg-blue-500/20 text-blue-400',
      POULES_IN_PROGRESS:       'bg-yellow-500/20 text-yellow-400',
      ELIMINATION_IN_PROGRESS:  'bg-orange-500/20 text-orange-400',
      FINISHED:                 'bg-green-500/20 text-green-400'
    };
    return map[phase] ?? 'bg-white/10 text-white/40';
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

import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AthleteService } from '../services/athlete.service';
import { AthleteBoutResponse, BoutStatus, BoutStatusLabels } from '../../../core/models/bout.models';

@Component({
  selector: 'app-athlete-bouts',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './bouts.page.html'
})
export class AthleteBoutsPageComponent implements OnInit {
  private readonly athleteService = inject(AthleteService);

  readonly bouts = signal<AthleteBoutResponse[]>([]);
  readonly loadingBouts = signal<boolean>(false);
  readonly boutsError = signal<string | null>(null);
  readonly boutStatusFilter = signal<BoutStatus | ''>('');
  readonly boutTournamentFilter = signal<string>('');
  readonly boutStatusLabels = BoutStatusLabels;

  readonly filteredBouts = computed(() => {
    const status = this.boutStatusFilter();
    const tournament = this.boutTournamentFilter().toLowerCase().trim();
    return this.bouts()
      .filter(b => !status || b.status === status)
      .filter(b => !tournament || b.tournamentName.toLowerCase().includes(tournament));
  });

  readonly boutStats = computed(() => {
    const finished = this.bouts().filter(b => b.status === 'FINISHED' && b.won !== null);
    const won = finished.filter(b => b.won).length;
    return { total: finished.length, won, lost: finished.length - won };
  });

  ngOnInit(): void {
    this.loadBouts();
  }

  loadBouts(): void {
    this.loadingBouts.set(true);
    this.boutsError.set(null);

    this.athleteService.getMyBouts().subscribe({
      next: (bouts) => {
        this.bouts.set(bouts);
        this.loadingBouts.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingBouts.set(false);
        this.boutsError.set(err.error?.message || 'Error al cargar tus combates.');
      }
    });
  }

  boutRoundLabel(bout: AthleteBoutResponse): string {
    if (bout.pouleNumber !== null) return `Poule ${bout.pouleNumber}`;
    const labels: Record<string, string> = {
      ROUND_OF_64: '32avos', ROUND_OF_32: '16avos', ROUND_OF_16: 'Octavos',
      QUARTERFINAL: 'Cuartos', SEMIFINAL: 'Semifinal', FINAL: 'Final'
    };
    return bout.eliminationRound ? (labels[bout.eliminationRound] ?? bout.eliminationRound) : '—';
  }
}

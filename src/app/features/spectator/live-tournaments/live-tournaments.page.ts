import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PublicTournamentService } from '../services/public-tournament.service';
import { OrganizerTournamentResponse } from '../../../core/models/tournament.models';
import { LabelPipe } from '../../../shared/pipes/label.pipe';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-live-tournaments',
  standalone: true,
  imports: [CommonModule, LabelPipe],
  templateUrl: './live-tournaments.page.html',
  styleUrl: './live-tournaments.page.css'
})
export class LiveTournamentsPageComponent implements OnInit {
  private readonly publicService = inject(PublicTournamentService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly tournaments = signal<OrganizerTournamentResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.publicService.getActiveTournaments().subscribe({
      next: (list) => {
        this.tournaments.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de torneos en vivo.');
        this.loading.set(false);
      }
    });
  }

  openTournament(id: number): void {
    this.router.navigate(['/live/tournament', id]);
  }

  goBack(): void {
    this.router.navigate([this.authService.isAuthenticated() ? '/athlete' : '/spectator']);
  }

  phaseLabel(phase: string | undefined): string {
    switch (phase) {
      case 'POULES_IN_PROGRESS':     return 'Poules en curso';
      case 'ELIMINATION_IN_PROGRESS': return 'Eliminación en curso';
      default: return 'En progreso';
    }
  }

  phaseBadgeClass(phase: string | undefined): string {
    return phase === 'POULES_IN_PROGRESS'
      ? 'bg-amber-50 text-amber-700 border border-amber-200'
      : 'bg-orange-50 text-orange-700 border border-orange-200';
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  OrganizerTournamentResponse,
  RefereeApplicationResponse,
  RefereeApplicationStatus
} from '../../../../core/models/tournament.models';
import { RefereeApplicationService } from '../../../tournament/services/referee-application.service';
import { LabelPipe } from '../../../../shared/pipes/label.pipe';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Component({
  selector: 'app-dashboard-referee',
  standalone: true,
  imports: [CommonModule, LabelPipe],
  templateUrl: './dashboard-referee.component.html'
})
export class DashboardRefereeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly refereeApplicationService = inject(RefereeApplicationService);

  readonly tournaments = signal<OrganizerTournamentResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly myApplications = signal<RefereeApplicationResponse[]>([]);

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
    return this.myApplications().find(a => a.tournamentId === tournamentId)?.status ?? null;
  }

  apply(tournamentId: number): void {
    this.refereeApplicationService.apply(tournamentId).subscribe({
      next: (app) => this.myApplications.update(apps => [...apps, app]),
      error: () => this.error.set('No se pudo enviar la postulación. Intentá de nuevo.')
    });
  }

  /** Withdraw a still-pending application */
  withdraw(tournamentId: number): void {
    const app = this.myApplications().find(a => a.tournamentId === tournamentId);
    if (!app) return;
    if (!confirm('¿Retirar tu postulación a este torneo?')) return;
    this.refereeApplicationService.cancel(app.id).subscribe({
      next: () => this.myApplications.update(apps => apps.filter(a => a.id !== app.id)),
      error: () => this.error.set('No se pudo retirar la postulación. Intentá de nuevo.')
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

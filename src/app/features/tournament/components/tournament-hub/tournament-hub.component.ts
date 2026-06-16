import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { OrganizerTournamentService } from '../../services/organizer-tournament.service';
import { OrganizerTournamentResponse, TournamentPhase } from '../../../../core/models/tournament.models';
import { LabelPipe } from '../../../../shared/pipes/label.pipe';
import { PouleManagerComponent } from '../poule-manager/poule-manager.component';
import { TournamentDetailComponent } from '../tournament-detail/tournament-detail.component';
import { RefereeApplicationsComponent } from '../referee-applications/referee-applications.component';

type HubTab = 'poules' | 'enrollments' | 'referees';

/**
 * Tournament management hub for the organizer. Single entry point per tournament
 * with three tabs: Poules/Eliminatorias (main), Inscriptos and Árbitros.
 * Each tab hosts an existing section component.
 */
@Component({
  selector: 'app-tournament-hub',
  standalone: true,
  imports: [CommonModule, LabelPipe, PouleManagerComponent, TournamentDetailComponent, RefereeApplicationsComponent],
  templateUrl: './tournament-hub.component.html',
  styleUrl: './tournament-hub.component.css'
})
export class TournamentHubComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tournamentService = inject(OrganizerTournamentService);

  tournamentId = 0;
  readonly tournament = signal<OrganizerTournamentResponse | null>(null);
  readonly activeTab = signal<HubTab>('poules');

  readonly tabs: { value: HubTab; label: string }[] = [
    { value: 'poules', label: 'Poules y Eliminatorias' },
    { value: 'enrollments', label: 'Inscriptos' },
    { value: 'referees', label: 'Árbitros' }
  ];

  ngOnInit(): void {
    this.tournamentId = +(this.route.snapshot.paramMap.get('id') ?? 0);
    this.tournamentService.getTournamentById(this.tournamentId).subscribe({
      next: (t) => this.tournament.set(t),
      error: () => {}
    });
  }

  setTab(tab: HubTab): void {
    this.activeTab.set(tab);
  }

  goBack(): void {
    this.router.navigate(['/tournament']);
  }

  goToResults(): void {
    this.router.navigate(['/results', this.tournamentId]);
  }

  phaseBadgeClass(phase: TournamentPhase): string {
    const map: Record<TournamentPhase, string> = {
      ENROLLMENT: 'bg-blue-50 text-blue-700 border border-blue-200',
      POULES_IN_PROGRESS: 'bg-amber-50 text-amber-700 border border-amber-200',
      ELIMINATION_IN_PROGRESS: 'bg-orange-50 text-orange-700 border border-orange-200',
      FINISHED: 'bg-emerald-50 text-emerald-700 border border-emerald-200'
    };
    return map[phase] ?? 'bg-slate-100 text-slate-600 border border-slate-200';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', {
      day: '2-digit', month: 'long', year: 'numeric'
    });
  }
}

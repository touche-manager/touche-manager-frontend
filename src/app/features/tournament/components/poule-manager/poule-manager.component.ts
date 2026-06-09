import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PouleService } from '../../services/poule.service';
import { OrganizerTournamentService } from '../../services/organizer-tournament.service';
import { RefereeApplicationService } from '../../services/referee-application.service';
import { BoutService } from '../../../bout/services/bout.service';
import {
  PouleResponse,
  PouleStandingEntry,
  EliminationBracketResponse,
  RefereeApplicationResponse
} from '../../../../core/models/tournament.models';
import { ELIMINATION_ROUND_LABELS } from '../../../../shared/utils/label.maps';

type ActiveTab = 'poules' | 'standings' | 'bracket';

@Component({
  selector: 'app-poule-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './poule-manager.component.html'
})
export class PouleManagerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pouleService = inject(PouleService);
  private readonly tournamentService = inject(OrganizerTournamentService);
  private readonly refereeAppService = inject(RefereeApplicationService);
  private readonly boutService = inject(BoutService);

  tournamentId = 0;
  readonly phase = signal<string>('');
  readonly activeTab = signal<ActiveTab>('poules');
  readonly poules = signal<PouleResponse[]>([]);
  readonly standings = signal<PouleStandingEntry[]>([]);
  readonly bracket = signal<EliminationBracketResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);
  readonly addRefereeId = signal<Record<number, string>>({});
  readonly addElimRefereeId = signal<Record<number, string>>({});
  readonly generatingBracket = signal(false);
  readonly generatingPoules = signal(false);
  readonly acceptedReferees = signal<RefereeApplicationResponse[]>([]);

  /** True when every poule has status FINISHED */
  readonly allPoulesFinished = computed(() => {
    const ps = this.poules();
    return ps.length > 0 && ps.every(p => p.status === 'FINISHED');
  });

  readonly finishedPoulesCount = computed(() =>
    this.poules().filter(p => p.status === 'FINISHED').length
  );

  ngOnInit(): void {
    this.tournamentId = +this.route.snapshot.paramMap.get('id')!;
    this.tournamentService.getTournamentById(this.tournamentId).subscribe({
      next: (t) => { this.phase.set(t.phase ?? 'ENROLLMENT'); this.loadPoules(); },
      error: () => { this.phase.set('ENROLLMENT'); this.loadPoules(); }
    });
    this.loadAcceptedReferees();
  }

  loadAcceptedReferees(): void {
    this.refereeAppService.getApplicationsForTournament(this.tournamentId).subscribe({
      next: (apps) => this.acceptedReferees.set(apps.filter(a => a.status === 'ACCEPTED')),
      error: () => {}
    });
  }

  loadPoules(): void {
    this.loading.set(true);
    this.pouleService.getPoulesForTournament(this.tournamentId).subscribe({
      next: (data) => { this.poules.set(data); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar las poules.'); this.loading.set(false); }
    });
  }

  loadStandings(): void {
    this.loading.set(true);
    this.pouleService.getStandings(this.tournamentId).subscribe({
      next: (data) => { this.standings.set(data); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar la clasificación.'); this.loading.set(false); }
    });
  }

  loadBracket(): void {
    this.loading.set(true);
    this.pouleService.getBracket(this.tournamentId).subscribe({
      next: (data) => { this.bracket.set(data); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar el bracket.'); this.loading.set(false); }
    });
  }

  setTab(tab: ActiveTab): void {
    this.activeTab.set(tab);
    this.error.set(null);
    if (tab === 'standings') this.loadStandings();
    if (tab === 'bracket') this.loadBracket();
  }

  generatePoules(): void {
    this.generatingPoules.set(true);
    this.error.set(null);
    this.pouleService.generatePoules(this.tournamentId).subscribe({
      next: (data) => {
        this.poules.set(data);
        this.phase.set('POULES_IN_PROGRESS');
        this.generatingPoules.set(false);
        this.showSuccess(`¡${data.length} poules generadas correctamente!`);
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'No se pudieron generar las poules.';
        this.error.set(msg);
        this.generatingPoules.set(false);
      }
    });
  }

  assignReferee(pouleId: number): void {
    const idStr = this.addRefereeId()[pouleId];
    const userId = parseInt(idStr, 10);
    if (!userId) return;
    this.pouleService.assignRefereeToPoule(pouleId, userId).subscribe({
      next: (updated) => {
        this.poules.update(ps => ps.map(p => p.id === pouleId ? updated : p));
        this.addRefereeId.update(m => ({ ...m, [pouleId]: '' }));
        this.showSuccess('Árbitro asignado.');
      },
      error: () => this.error.set('No se pudo asignar el árbitro.')
    });
  }

  removeReferee(pouleId: number, refereeUserId: number): void {
    this.pouleService.removeRefereeFromPoule(pouleId, refereeUserId).subscribe({
      next: (updated) => this.poules.update(ps => ps.map(p => p.id === pouleId ? updated : p)),
      error: () => this.error.set('No se pudo remover el árbitro.')
    });
  }

  generateBracket(): void {
    if (!confirm('¿Estás seguro que querés cerrar las poules y generar el bracket de eliminatorias?')) return;
    this.generatingBracket.set(true);
    this.pouleService.generateBracket(this.tournamentId).subscribe({
      next: (data) => {
        this.bracket.set(data);
        this.phase.set('ELIMINATION_IN_PROGRESS');
        this.generatingBracket.set(false);
        this.activeTab.set('bracket');
        this.showSuccess('¡Bracket generado! El torneo avanzó a fase de eliminatorias.');
      },
      error: () => {
        this.error.set('No se pudo generar el bracket.');
        this.generatingBracket.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/tournament', this.tournamentId]);
  }

  goToResults(): void {
    this.router.navigate(['/results', this.tournamentId]);
  }

  getRefereeId(pouleId: number): string {
    return this.addRefereeId()[pouleId] ?? '';
  }

  setRefereeId(pouleId: number, val: string): void {
    this.addRefereeId.update(m => ({ ...m, [pouleId]: val }));
  }

  getElimRefereeId(boutId: number): string {
    return this.addElimRefereeId()[boutId] ?? '';
  }

  setElimRefereeId(boutId: number, val: string): void {
    this.addElimRefereeId.update(m => ({ ...m, [boutId]: val }));
  }

  assignRefereeToEliminationBout(boutId: number): void {
    const idStr = this.getElimRefereeId(boutId);
    const userId = parseInt(idStr, 10);
    if (!userId) return;
    this.boutService.assignRefereeToEliminationBout(boutId, userId).subscribe({
      next: (updatedBout) => {
        this.bracket.update(b => {
          if (!b) return null;
          const updatedRoundBouts = { ...b.roundBouts };
          for (const round of Object.keys(updatedRoundBouts)) {
            const list = updatedRoundBouts[round as keyof typeof b.roundBouts] || [];
            const idx = list.findIndex(bt => bt.id === boutId);
            if (idx !== -1) {
              const newList = [...list];
              newList[idx] = updatedBout;
              updatedRoundBouts[round as keyof typeof b.roundBouts] = newList;
              break;
            }
          }
          return { ...b, roundBouts: updatedRoundBouts };
        });
        this.addElimRefereeId.update(m => ({ ...m, [boutId]: '' }));
        this.showSuccess('Árbitro asignado al asalto.');
      },
      error: () => this.error.set('No se pudo asignar el árbitro al asalto.')
    });
  }

  removeRefereeFromEliminationBout(boutId: number, refereeUserId: number): void {
    this.boutService.removeRefereeFromEliminationBout(boutId, refereeUserId).subscribe({
      next: (updatedBout) => {
        this.bracket.update(b => {
          if (!b) return null;
          const updatedRoundBouts = { ...b.roundBouts };
          for (const round of Object.keys(updatedRoundBouts)) {
            const list = updatedRoundBouts[round as keyof typeof b.roundBouts] || [];
            const idx = list.findIndex(bt => bt.id === boutId);
            if (idx !== -1) {
              const newList = [...list];
              newList[idx] = updatedBout;
              updatedRoundBouts[round as keyof typeof b.roundBouts] = newList;
              break;
            }
          }
          return { ...b, roundBouts: updatedRoundBouts };
        });
        this.showSuccess('Árbitro removido del asalto.');
      },
      error: () => this.error.set('No se pudo remover el árbitro del asalto.')
    });
  }

  boutProgress(poule: PouleResponse): number {
    return poule.totalBouts > 0 ? Math.round((poule.finishedBouts / poule.totalBouts) * 100) : 0;
  }

  bracketRounds(b: EliminationBracketResponse): { round: string; label: string; bouts: any[] }[] {
    if (!b) return [];
    return Object.entries(b.roundBouts).map(([round, bouts]) => ({
      round,
      label: ELIMINATION_ROUND_LABELS[round as keyof typeof ELIMINATION_ROUND_LABELS] ?? round,
      bouts: bouts as any[]
    }));
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3000);
  }
}

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PouleService } from '../../services/poule.service';
import { OrganizerTournamentService } from '../../services/organizer-tournament.service';
import { RefereeApplicationService } from '../../services/referee-application.service';
import { BoutService } from '../../../bout/services/bout.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import {
  PouleResponse,
  PouleStandingEntry,
  EliminationBracketResponse,
  RefereeApplicationResponse,
  EliminationRound
} from '../../../../core/models/tournament.models';
import { ELIMINATION_ROUND_LABELS } from '../../../../shared/utils/label.maps';
import { PouleTableComponent } from '../../../../shared/components/poule-table/poule-table.component';

type ActiveTab = 'poules' | 'standings' | 'bracket';

@Component({
  selector: 'app-poule-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, PouleTableComponent],
  templateUrl: './poule-manager.component.html'
})
export class PouleManagerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pouleService = inject(PouleService);
  private readonly tournamentService = inject(OrganizerTournamentService);
  private readonly refereeAppService = inject(RefereeApplicationService);
  private readonly boutService = inject(BoutService);
  private readonly notificationService = inject(NotificationService);

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
  readonly pisteInput = signal<Record<number, string>>({});
  readonly expandedPoules = signal<Record<number, boolean>>({});
  readonly summoningBoutId = signal<number | null>(null);

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
    if (tab === 'bracket') {
      this.loadBracket();
      this.loadStandings(); // Load standings to calculate seed numbers
    }
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
        this.loadStandings(); // Load standings to calculate seed numbers
        this.showSuccess('¡Bracket generado! El torneo avanzó a fase de eliminatorias.');
      },
      error: () => {
        this.error.set('No se pudo generar el bracket.');
        this.generatingBracket.set(false);
      }
    });
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

  // ── Piste assignment & athlete summon ───────────────────────────────────

  togglePouleBouts(pouleId: number): void {
    this.expandedPoules.update(m => ({ ...m, [pouleId]: !m[pouleId] }));
  }

  isPouleExpanded(pouleId: number): boolean {
    return !!this.expandedPoules()[pouleId];
  }

  getPisteInput(boutId: number): string {
    return this.pisteInput()[boutId] ?? '';
  }

  setPisteInput(boutId: number, val: string): void {
    this.pisteInput.update(m => ({ ...m, [boutId]: val }));
  }

  assignPiste(boutId: number, inBracket = false): void {
    const piste = this.getPisteInput(boutId).trim();
    if (!piste) return;
    this.boutService.updatePiste(boutId, piste).subscribe({
      next: () => {
        this.pisteInput.update(m => ({ ...m, [boutId]: '' }));
        if (inBracket) this.loadBracket(); else this.loadPoules();
        this.showSuccess(`Pista "${piste}" asignada al asalto.`);
      },
      error: () => this.error.set('No se pudo asignar la pista.')
    });
  }

  summonBoutAthletes(boutId: number, piste: string | null): void {
    if (!confirm('¿Convocar a los atletas? Recibirán una notificación de que su combate comienza en 5 minutos.')) return;
    this.summoningBoutId.set(boutId);
    this.notificationService.notifyUpcomingBout(boutId, {
      minutesAhead: 5,
      piste: piste ?? undefined
    }).subscribe({
      next: () => {
        this.summoningBoutId.set(null);
        this.showSuccess('Atletas convocados correctamente.');
      },
      error: () => {
        this.summoningBoutId.set(null);
        this.error.set('No se pudo enviar la convocatoria.');
      }
    });
  }

  boutProgress(poule: PouleResponse): number {
    return poule.totalBouts > 0 ? Math.round((poule.finishedBouts / poule.totalBouts) * 100) : 0;
  }

  private static readonly ROUND_ORDER = [
    'ROUND_OF_64',
    'ROUND_OF_32',
    'ROUND_OF_16',
    'QUARTERFINAL',
    'SEMIFINAL',
    'FINAL'
  ];

  bracketRounds(b: EliminationBracketResponse): { round: string; label: string; bouts: any[] }[] {
    if (!b) return [];
    const keys = Object.keys(b.roundBouts) as EliminationRound[];
    const sortedKeys = keys.sort((a, b) => {
      const idxA = PouleManagerComponent.ROUND_ORDER.indexOf(a);
      const idxB = PouleManagerComponent.ROUND_ORDER.indexOf(b);
      return idxA - idxB;
    });

    return sortedKeys.map(round => ({
      round,
      label: ELIMINATION_ROUND_LABELS[round] ?? round,
      bouts: (b.roundBouts[round] || []).sort((a, b) => (a.bracketPosition ?? 0) - (b.bracketPosition ?? 0))
    }));
  }

  getBoutCell(poule: PouleResponse, athleteId: number, opponentId: number): { text: string; class: string } {
    const bout = poule.bouts.find(b =>
      (b.athleteLeft.id === athleteId && b.athleteRight?.id === opponentId) ||
      (b.athleteRight?.id === athleteId && b.athleteLeft.id === opponentId)
    );
    if (!bout) return { text: '', class: '' };
    if (bout.status === 'FINISHED') {
      const isLeft = bout.athleteLeft.id === athleteId;
      const score = isLeft ? bout.scoreLeft : bout.scoreRight;
      const won = bout.winnerId === athleteId;
      return {
        text: won ? `V${score}` : `D${score}`,
        class: won ? 'text-emerald-600 font-bold bg-emerald-50/40' : 'text-red-500 font-medium bg-red-50/20'
      };
    }
    if (bout.status === 'IN_PROGRESS') {
      return { text: '⏱️', class: 'text-amber-600 bg-amber-50/30 font-bold' };
    }
    return { text: '', class: '' };
  }

  getPouleAthleteStats(poule: PouleResponse, athleteId: number): { victories: number; touchesScored: number; touchesReceived: number; indicator: string; classification: string } {
    let victories = 0;
    let touchesScored = 0;
    let touchesReceived = 0;

    for (const bout of poule.bouts) {
      if (bout.status !== 'FINISHED') continue;
      if (bout.athleteLeft.id === athleteId) {
        touchesScored += bout.scoreLeft;
        if (bout.athleteRight) touchesReceived += bout.scoreRight;
        if (bout.winnerId === athleteId) victories++;
      } else if (bout.athleteRight?.id === athleteId) {
        touchesScored += bout.scoreRight;
        touchesReceived += bout.scoreLeft;
        if (bout.winnerId === athleteId) victories++;
      }
    }

    const isFinished = poule.status === 'FINISHED';
    const indicatorStr = isFinished ? (touchesScored - touchesReceived).toString() : '—';
    
    let classificationStr = '—';
    if (isFinished) {
      const list = poule.athletes.map(ath => {
        let v = 0;
        let ts = 0;
        let tr = 0;
        for (const b of poule.bouts) {
          if (b.status !== 'FINISHED') continue;
          if (b.athleteLeft.id === ath.id) {
            ts += b.scoreLeft;
            if (b.athleteRight) tr += b.scoreRight;
            if (b.winnerId === ath.id) v++;
          } else if (b.athleteRight?.id === ath.id) {
            ts += b.scoreRight;
            tr += b.scoreLeft;
            if (b.winnerId === ath.id) v++;
          }
        }
        return { id: ath.id, victories: v, indicator: ts - tr, touchesScored: ts };
      });

      list.sort((a, b) => {
        if (b.victories !== a.victories) return b.victories - a.victories;
        if (b.indicator !== a.indicator) return b.indicator - a.indicator;
        return b.touchesScored - a.touchesScored;
      });

      const rankIndex = list.findIndex(item => item.id === athleteId);
      classificationStr = rankIndex !== -1 ? (rankIndex + 1).toString() : '—';
    }

    return {
      victories,
      touchesScored,
      touchesReceived,
      indicator: indicatorStr,
      classification: classificationStr
    };
  }

  getSeedNumber(athleteId: number): number | null {
    const list = this.standings();
    if (list.length === 0) return null;
    const idx = list.findIndex(entry => entry.athleteId === athleteId);
    return idx !== -1 ? idx + 1 : null;
  }

  mapPouleToRows(poule: PouleResponse): any[] {
    return poule.athletes.map((athlete, i) => {
      const cells = poule.athletes.map((opponent, j) => {
        if (i === j) {
          return { text: '', cssClass: 'diagonal' };
        }
        const cell = this.getBoutCell(poule, athlete.id, opponent.id);
        let cssClass = '';
        if (cell.text.startsWith('V')) {
          cssClass = 'win';
        } else if (cell.text.startsWith('D')) {
          cssClass = 'loss';
        }
        return { text: cell.text, cssClass };
      });

      const stats = this.getPouleAthleteStats(poule, athlete.id);
      return {
        index: i + 1,
        athlete: { id: athlete.id, fullName: athlete.fullName },
        cells,
        stats: {
          victories: stats.victories,
          touchesScored: stats.touchesScored,
          touchesReceived: stats.touchesReceived,
          indicator: stats.indicator !== '—' && +stats.indicator >= 0 ? `+${stats.indicator}` : stats.indicator,
          classification: stats.classification !== '—' ? `${stats.classification}°` : '—'
        }
      };
    });
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3000);
  }
}

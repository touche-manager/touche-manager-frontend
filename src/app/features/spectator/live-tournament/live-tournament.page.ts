import {
  Component,
  NgZone,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { PublicTournamentService } from '../services/public-tournament.service';
import {
  OrganizerTournamentResponse,
  PouleResponse,
  PouleStandingEntry,
  EliminationBracketResponse,
  EliminationRound,
  BoutResponse
} from '../../../core/models/tournament.models';
import { LabelPipe } from '../../../shared/pipes/label.pipe';
import {
  BracketRoundColumnComponent,
  BracketRoundData,
  BracketCardData
} from '../../../shared/components/bracket-round-column/bracket-round-column.component';
import {
  PouleTableComponent,
  PouleTableRowData
} from '../../../shared/components/poule-table/poule-table.component';
import { ToucheTableComponent } from '../../../shared/components/touche-table/touche-table.component';
import { ELIMINATION_ROUND_LABELS } from '../../../shared/utils/label.maps';

type LiveTab = 'poules' | 'standings' | 'bracket';

@Component({
  selector: 'app-live-tournament',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LabelPipe,
    PouleTableComponent,
    ToucheTableComponent,
    BracketRoundColumnComponent
  ],
  templateUrl: './live-tournament.page.html',
  styleUrl: './live-tournament.page.css'
})
export class LiveTournamentPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly publicService = inject(PublicTournamentService);

  tournamentId = 0;

  readonly tournament = signal<OrganizerTournamentResponse | null>(null);
  readonly activeTab = signal<LiveTab>('poules');
  readonly poules = signal<PouleResponse[]>([]);
  readonly standings = signal<PouleStandingEntry[]>([]);
  readonly bracket = signal<EliminationBracketResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  private loadedTabs = new Set<LiveTab>();
  private eventSource: EventSource | null = null;

  private static readonly ROUND_ORDER: EliminationRound[] = [
    'ROUND_OF_64',
    'ROUND_OF_32',
    'ROUND_OF_16',
    'QUARTERFINAL',
    'SEMIFINAL',
    'FINAL'
  ];

  // ── Computed: any IN_PROGRESS bouts in poules ─────────────────────────────

  readonly hasLiveBouts = computed(() =>
    this.poules().some(p => p.bouts.some(b => b.status === 'IN_PROGRESS'))
  );

  // ── Computed: bracket rounds for BracketRoundColumnComponent ──────────────

  private getBracketSeeds(tableauSize: number): Record<string, { leftSeed: number; rightSeed: number }[]> {
    const result: Record<string, { leftSeed: number; rightSeed: number }[]> = {};
    let list = [1];
    while (list.length < tableauSize) {
      const nextList: number[] = [];
      const doubleLen = list.length * 2;
      for (const x of list) {
        nextList.push(x);
        nextList.push(doubleLen + 1 - x);
      }
      list = nextList;
    }

    const roundKeys: EliminationRound[] = [
      'ROUND_OF_64',
      'ROUND_OF_32',
      'ROUND_OF_16',
      'QUARTERFINAL',
      'SEMIFINAL',
      'FINAL'
    ];

    const totalRounds = Math.log2(tableauSize);
    const startIdx = 6 - totalRounds;

    const firstRoundKey = roundKeys[startIdx];
    const firstRoundBouts: { leftSeed: number; rightSeed: number }[] = [];
    for (let p = 1; p <= tableauSize / 2; p++) {
      firstRoundBouts.push({
        leftSeed: list[2 * p - 2],
        rightSeed: list[2 * p - 1]
      });
    }
    result[firstRoundKey] = firstRoundBouts;

    let prevRoundBouts = firstRoundBouts;
    for (let idx = startIdx + 1; idx < 6; idx++) {
      const roundKey = roundKeys[idx];
      const roundBouts: { leftSeed: number; rightSeed: number }[] = [];
      const numBouts = prevRoundBouts.length / 2;
      for (let p = 1; p <= numBouts; p++) {
        const leftMatch = prevRoundBouts[2 * p - 2];
        const rightMatch = prevRoundBouts[2 * p - 1];
        roundBouts.push({
          leftSeed: Math.min(leftMatch.leftSeed, leftMatch.rightSeed),
          rightSeed: Math.min(rightMatch.leftSeed, rightMatch.rightSeed)
        });
      }
      result[roundKey] = roundBouts;
      prevRoundBouts = roundBouts;
    }

    return result;
  }

  readonly bracketRoundData = computed<BracketRoundData[]>(() => {
    const b = this.bracket();
    if (!b) return [];
    const tableauSize = b.tableauSize ?? 16;
    const seedsMap = this.getBracketSeeds(tableauSize);

    const roundKeys: EliminationRound[] = [
      'ROUND_OF_64',
      'ROUND_OF_32',
      'ROUND_OF_16',
      'QUARTERFINAL',
      'SEMIFINAL',
      'FINAL'
    ];
    const totalRounds = Math.log2(tableauSize);
    const startIdx = 6 - totalRounds;
    const activeRounds = roundKeys.slice(startIdx);

    return activeRounds.map(round => {
      const isFirstRound = round === activeRounds[0];
      const roundSeeds = seedsMap[round] || [];
      const relativeRoundIndex = activeRounds.indexOf(round);
      const numBouts = (tableauSize / 2) / Math.pow(2, relativeRoundIndex);

      const existingBouts = b.roundBouts[round] || [];
      const bouts: BracketCardData[] = [];

      for (let p = 1; p <= numBouts; p++) {
        const bout = existingBouts.find(x => x.bracketPosition === p);
        const theoreticalSeeds = roundSeeds[p - 1] || { leftSeed: null, rightSeed: null };

        if (bout) {
          const winnerSide: 'left' | 'right' | null = bout.winnerId
            ? (bout.winnerId === bout.athleteLeft?.id ? 'left' : 'right')
            : null;

          bouts.push({
            id: bout.id,
            bracketPosition: p,
            leftName: bout.athleteLeft
              ? `${bout.athleteLeft.firstName} ${bout.athleteLeft.lastName}`
              : 'A confirmar',
            leftSeed: theoreticalSeeds.leftSeed,
            rightName: bout.athleteRight
              ? `${bout.athleteRight.firstName} ${bout.athleteRight.lastName}`
              : (isFirstRound ? null : 'A confirmar'),
            rightSeed: theoreticalSeeds.rightSeed,
            scoreLeft: bout.scoreLeft ?? null,
            scoreRight: bout.scoreRight ?? null,
            winnerId: bout.winnerId ?? null,
            leftId: bout.athleteLeft?.id ?? null,
            rightId: bout.athleteRight?.id ?? null,
            winnerSide,
            piste: bout.piste ?? null,
            refereeLabel: bout.referees?.length
              ? bout.referees[0].fullName
              : null,
            status: bout.status
          });
        } else {
          bouts.push({
            id: -(relativeRoundIndex * 100 + p),
            bracketPosition: p,
            leftName: 'A confirmar',
            leftSeed: theoreticalSeeds.leftSeed,
            rightName: isFirstRound ? null : 'A confirmar',
            rightSeed: theoreticalSeeds.rightSeed,
            scoreLeft: null,
            scoreRight: null,
            winnerId: null,
            leftId: null,
            rightId: null,
            winnerSide: null,
            piste: null,
            refereeLabel: null,
            status: 'PENDING'
          });
        }
      }

      return {
        roundKey: round,
        label: ELIMINATION_ROUND_LABELS[round] ?? round,
        bouts
      };
    });
  });

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.tournamentId = +this.route.snapshot.paramMap.get('id')!;

    this.publicService.getPublicTournaments().subscribe({
      next: (list) => {
        const found = list.find(t => t.id === this.tournamentId) ?? null;
        this.tournament.set(found);
      },
      error: () => {}
    });

    this.loadTab('poules');
    this.connectSSE();
  }

  ngOnDestroy(): void {
    this.eventSource?.close();
    this.eventSource = null;
  }

  // ── SSE (public — no JWT) ─────────────────────────────────────────────────

  private connectSSE(): void {
    const url = `${environment.apiUrl}/tournaments/${this.tournamentId}/live`;
    this.eventSource = new EventSource(url);
    this.eventSource.addEventListener('refresh', () => {
      this.zone.run(() => this.silentReloadCurrentTab());
    });
    this.eventSource.onerror = () => { /* EventSource reconnects automatically */ };
  }

  private silentReloadCurrentTab(): void {
    const tab = this.activeTab();
    if (tab === 'poules') {
      this.publicService.getPoules(this.tournamentId).subscribe({
        next: (data) => this.poules.set(data),
        error: () => {}
      });
    } else if (tab === 'standings') {
      this.publicService.getStandings(this.tournamentId).subscribe({
        next: (data) => this.standings.set(data),
        error: () => {}
      });
    } else if (tab === 'bracket') {
      this.publicService.getBracket(this.tournamentId).subscribe({
        next: (data) => { if (data) this.bracket.set(data); },
        error: () => {}
      });
    }
  }

  // ── Tab switching ─────────────────────────────────────────────────────────

  setTab(tab: LiveTab): void {
    this.activeTab.set(tab);
    this.error.set(null);
    if (!this.loadedTabs.has(tab)) {
      this.loadTab(tab);
    }
    // Always load standings alongside bracket for seeding
    if (tab === 'bracket' && !this.loadedTabs.has('standings')) {
      this.publicService.getStandings(this.tournamentId).subscribe({
        next: (data) => { this.standings.set(data); this.loadedTabs.add('standings'); },
        error: () => {}
      });
    }
  }

  private loadTab(tab: LiveTab): void {
    this.loading.set(true);
    this.error.set(null);

    if (tab === 'poules') {
      this.publicService.getPoules(this.tournamentId).subscribe({
        next: (data) => { this.poules.set(data); this.loadedTabs.add('poules'); this.loading.set(false); },
        error: () => { this.error.set('No se pudieron cargar las poules.'); this.loading.set(false); }
      });
    } else if (tab === 'standings') {
      this.publicService.getStandings(this.tournamentId).subscribe({
        next: (data) => { this.standings.set(data); this.loadedTabs.add('standings'); this.loading.set(false); },
        error: () => { this.error.set('No se pudo cargar la clasificación.'); this.loading.set(false); }
      });
    } else if (tab === 'bracket') {
      this.publicService.getBracket(this.tournamentId).subscribe({
        next: (data) => { if (data) this.bracket.set(data); this.loadedTabs.add('bracket'); this.loading.set(false); },
        error: () => { this.error.set('No se pudo cargar el bracket.'); this.loading.set(false); }
      });
    }
  }

  // ── Poule table rows (same logic as PouleManagerComponent) ───────────────

  mapPouleToRows(poule: PouleResponse): PouleTableRowData[] {
    return poule.athletes.map((athlete, i) => {
      const cells = poule.athletes.map((opponent, j) => {
        if (i === j) return { text: '', cssClass: 'diagonal' };
        const cell = this.getBoutCell(poule, athlete.id, opponent.id);
        return { text: cell.text, cssClass: cell.cssClass, boutId: cell.boutId };
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

  private getBoutCell(poule: PouleResponse, athleteId: number, opponentId: number): { text: string; cssClass: string; boutId?: number } {
    const bout = poule.bouts.find((b: BoutResponse) =>
      (b.athleteLeft.id === athleteId && b.athleteRight?.id === opponentId) ||
      (b.athleteRight?.id === athleteId && b.athleteLeft.id === opponentId)
    );
    if (!bout) return { text: '', cssClass: '' };
    if (bout.status === 'FINISHED') {
      const isLeft = bout.athleteLeft.id === athleteId;
      const score = isLeft ? bout.scoreLeft : bout.scoreRight;
      const won = bout.winnerId === athleteId;
      return {
        text: won ? `V${score}` : `D${score}`,
        cssClass: won ? 'win' : 'loss'
      };
    }
    if (bout.status === 'IN_PROGRESS') {
      return { text: '', cssClass: 'in-progress', boutId: bout.id };
    }
    return { text: '', cssClass: '' };
  }

  private getPouleAthleteStats(poule: PouleResponse, athleteId: number): { victories: number; touchesScored: number; touchesReceived: number; indicator: string; classification: string } {
    let victories = 0, touchesScored = 0, touchesReceived = 0;
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
        let v = 0, ts = 0, tr = 0;
        for (const b of poule.bouts) {
          if (b.status !== 'FINISHED') continue;
          if (b.athleteLeft.id === ath.id) { ts += b.scoreLeft; if (b.athleteRight) tr += b.scoreRight; if (b.winnerId === ath.id) v++; }
          else if (b.athleteRight?.id === ath.id) { ts += b.scoreRight; tr += b.scoreLeft; if (b.winnerId === ath.id) v++; }
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
    return { victories, touchesScored, touchesReceived, indicator: indicatorStr, classification: classificationStr };
  }

  boutProgress(poule: PouleResponse): number {
    return poule.totalBouts > 0 ? Math.round((poule.finishedBouts / poule.totalBouts) * 100) : 0;
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/live']);
  }

  navigateToLiveBout(boutId: number): void {
    this.router.navigate(['/live/bout', boutId]);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  phaseBadgeClass(phase: string): string {
    const map: Record<string, string> = {
      POULES_IN_PROGRESS:     'bg-amber-50 text-amber-700 border border-amber-200',
      ELIMINATION_IN_PROGRESS:'bg-orange-50 text-orange-700 border border-orange-200',
      FINISHED:               'bg-emerald-50 text-emerald-700 border border-emerald-200',
      ENROLLMENT:             'bg-blue-50 text-blue-700 border border-blue-200'
    };
    return map[phase] ?? 'bg-slate-100 text-slate-600 border border-slate-200';
  }

  getPouleStatusLabel(status: string): string {
    switch (status) {
      case 'IN_PROGRESS': return 'En curso';
      case 'FINISHED':    return 'Finalizada';
      default:            return 'Pendiente';
    }
  }

  getPouleStatusClass(status: string): string {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'FINISHED':    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:            return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  }

  trackByPouleId(_: number, p: PouleResponse): number { return p.id; }
}

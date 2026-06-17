import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { TournamentResultResponse, PodiumEntry, BracketRound } from '../../../../core/models/tournament.models';
import { LabelPipe } from '../../../../shared/pipes/label.pipe';
import {
  BracketRoundColumnComponent,
  BracketRoundData,
  BracketCardData
} from '../../../../shared/components/bracket-round-column/bracket-round-column.component';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Component({
  selector: 'app-tournament-results',
  standalone: true,
  imports: [CommonModule, LabelPipe, BracketRoundColumnComponent],
  templateUrl: './tournament-results.component.html'
})
export class TournamentResultsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);

  readonly result = signal<TournamentResultResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('ID de torneo no encontrado'); this.loading.set(false); return; }

    this.http.get<ApiResponse<TournamentResultResponse>>(
      `${environment.apiUrl}/tournaments/${id}/results`
    ).subscribe({
      next: (res) => {
        this.result.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudieron cargar los resultados');
        this.loading.set(false);
      }
    });
  }

  getByRank(rank: number): PodiumEntry | undefined {
    return this.result()?.podium.find(p => p.rank === rank);
  }

  getByRankAll(rank: number): PodiumEntry[] {
    return this.result()?.podium.filter(p => p.rank === rank) ?? [];
  }

  /** Converts the results API BracketData into the shared BracketRoundData[] format. */
  readonly resultBracketRoundData = computed<BracketRoundData[]>(() => {
    const resultVal = this.result();
    const bracket = resultVal?.bracket;
    if (!bracket?.rounds?.length) return [];

    const getSeedByName = (name: string | null | undefined): number | null => {
      if (!name) return null;
      const classification = resultVal?.pouleClassification;
      if (!classification) return null;
      const found = classification.find(c => c.fullName.trim().toLowerCase() === name.trim().toLowerCase());
      return found ? found.rank : null;
    };

    return bracket.rounds.map((round: BracketRound): BracketRoundData => ({
      roundKey: round.round,
      label: round.roundLabel,
      bouts: round.bouts.map((bout): BracketCardData => {
        const winnerSide: 'left' | 'right' | null = bout.winnerName
          ? (bout.winnerName === bout.leftName ? 'left' : 'right')
          : null;
        return {
          id: bout.boutId,
          bracketPosition: bout.bracketPosition,
          leftName: bout.leftName,
          leftSeed: getSeedByName(bout.leftName),
          rightName: bout.rightName || null,
          rightSeed: getSeedByName(bout.rightName),
          scoreLeft: bout.finished ? bout.scoreLeft : null,
          scoreRight: bout.finished ? bout.scoreRight : null,
          winnerId: null,     // not exposed in results API, use winnerSide instead
          leftId: null,
          rightId: null,
          winnerSide,
          piste: bout.piste,
          refereeLabel: null, // not exposed in results API
          status: bout.status
        };
      })
    }));
  });
}

import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import {
  TournamentResultResponse,
  PouleSheet,
  PouleRow,
  BracketRound,
  BracketBout,
} from '../../../../core/models/tournament.models';
import { LabelPipe } from '../../../../shared/pipes/label.pipe';
import { PouleTableComponent } from '../../../../shared/components/poule-table/poule-table.component';
import {
  BracketRoundColumnComponent,
  BracketRoundData,
  BracketCardData
} from '../../../../shared/components/bracket-round-column/bracket-round-column.component';
import { ToucheTableComponent } from '../../../../shared/components/touche-table/touche-table.component';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Component({
  selector: 'app-tournament-public-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LabelPipe,
    PouleTableComponent,
    BracketRoundColumnComponent,
    ToucheTableComponent
  ],
  templateUrl: './tournament-public-detail.page.html',
  styleUrls: ['./tournament-public-detail.page.css'],
})
export class TournamentPublicDetailPageComponent implements OnInit {
  private readonly http  = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly error   = signal<string | null>(null);
  readonly result  = signal<TournamentResultResponse | null>(null);

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

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.error.set('ID de torneo inválido'); this.loading.set(false); return; }

    this.http.get<ApiResponse<TournamentResultResponse>>(
      `${environment.apiUrl}/tournaments/${id}/results`
    ).subscribe({
      next: (res) => { this.result.set(res.data); this.loading.set(false); },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudo cargar el detalle del torneo');
        this.loading.set(false);
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** All column indices for a poule sheet (1..n) */
  allIndices(sheet: PouleSheet): number[] {
    return sheet.rows.map(r => r.index);
  }

  /** Returns the cell value for a given row and opponent index, or '■' for diagonal */
  cell(row: PouleRow, opponentIdx: number): string {
    if (row.index === opponentIdx) return '■';
    return row.cells[opponentIdx] ?? '';
  }

  cellClass(value: string): string {
    if (value === '■') return 'diagonal';
    if (value.startsWith('V')) return 'win';
    if (value.startsWith('D')) return 'loss';
    return '';
  }

  mapSheetToRows(sheet: PouleSheet): any[] {
    const indices = this.allIndices(sheet);
    return sheet.rows.map(row => {
      const cells = indices.map(idx => {
        const value = this.cell(row, idx);
        let cssClass = '';
        if (value === '■') {
          cssClass = 'diagonal';
        } else if (value.startsWith('V')) {
          cssClass = 'win';
        } else if (value.startsWith('D')) {
          cssClass = 'loss';
        }
        return { text: value === '■' ? '' : value, cssClass };
      });

      return {
        index: row.index,
        athlete: { id: row.athleteId, fullName: row.fullName },
        cells,
        stats: {
          victories: row.victories,
          touchesScored: row.touchesScored,
          touchesReceived: row.touchesReceived,
          indicator: row.indicator >= 0 ? `+${row.indicator}` : `${row.indicator}`,
          classification: row.rank ? `${row.rank}°` : '—'
        }
      };
    });
  }

  print(): void {
    window.print();
  }
}

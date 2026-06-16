import { Component, inject, signal, OnInit } from '@angular/core';
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

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Component({
  selector: 'app-tournament-public-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LabelPipe, PouleTableComponent],
  templateUrl: './tournament-public-detail.page.html',
  styleUrls: ['./tournament-public-detail.page.css'],
})
export class TournamentPublicDetailPageComponent implements OnInit {
  private readonly http  = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(true);
  readonly error   = signal<string | null>(null);
  readonly result  = signal<TournamentResultResponse | null>(null);

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

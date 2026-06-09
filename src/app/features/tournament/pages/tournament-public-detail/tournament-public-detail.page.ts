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

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Component({
  selector: 'app-tournament-public-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, LabelPipe],
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

  print(): void {
    window.print();
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { TournamentResultResponse, PodiumEntry } from '../../../../core/models/tournament.models';
import { LabelPipe } from '../../../../shared/pipes/label.pipe';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Component({
  selector: 'app-tournament-results',
  standalone: true,
  imports: [CommonModule, LabelPipe],
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
}

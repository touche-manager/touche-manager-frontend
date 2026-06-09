import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { TournamentResultResponse, PodiumEntry } from '../../../core/models/tournament.models';
import { LabelPipe } from '../../../shared/pipes/label.pipe';
import { WEAPON_OPTIONS, CATEGORY_OPTIONS, GENDER_OPTIONS } from '../../../shared/utils/filter-options';
import { Weapon, TournamentCategory, Gender } from '../../../shared/utils/label.maps';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Component({
  selector: 'app-rankings-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LabelPipe],
  templateUrl: './rankings.page.html',
  styleUrls: ['./rankings.page.css'],
})
export class RankingsPageComponent {
  private readonly http = inject(HttpClient);

  // ── Filter state ─────────────────────────────────────────────────
  filterCategory: TournamentCategory | '' = '';
  filterGender:   Gender | ''             = '';
  filterWeapon:   Weapon | ''             = '';
  filterDateFrom  = '';
  filterDateTo    = '';

  // ── Filter options (from shared utils — no duplication) ──────────
  readonly categories = CATEGORY_OPTIONS;
  readonly genders    = GENDER_OPTIONS;
  readonly weapons    = WEAPON_OPTIONS;

  // ── Reactive state ───────────────────────────────────────────────
  readonly loading     = signal(false);
  readonly searched    = signal(false);
  readonly error       = signal<string | null>(null);
  readonly results     = signal<TournamentResultResponse[]>([]);
  readonly expandedIds = signal<Set<number>>(new Set());

  // ── Actions ──────────────────────────────────────────────────────
  search(): void {
    this.loading.set(true);
    this.error.set(null);
    this.searched.set(true);

    let params = new HttpParams();
    if (this.filterCategory)  params = params.set('category', this.filterCategory);
    if (this.filterGender)    params = params.set('gender',   this.filterGender);
    if (this.filterWeapon)    params = params.set('weapon',   this.filterWeapon);
    if (this.filterDateFrom)  params = params.set('dateFrom', this.filterDateFrom);
    if (this.filterDateTo)    params = params.set('dateTo',   this.filterDateTo);

    this.http.get<ApiResponse<TournamentResultResponse[]>>(
      `${environment.apiUrl}/rankings`, { params }
    ).subscribe({
      next: (res) => {
        this.results.set(res.data ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudieron cargar los rankings');
        this.results.set([]);
        this.loading.set(false);
      }
    });
  }

  toggleExpanded(id: number): void {
    const current = new Set(this.expandedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.expandedIds.set(current);
  }

  getPodiumByRank(t: TournamentResultResponse, rank: number): PodiumEntry | undefined {
    return t.podium.find(p => p.rank === rank);
  }

  getPodiumByRankAll(t: TournamentResultResponse, rank: number): PodiumEntry[] {
    return t.podium.filter(p => p.rank === rank);
  }
}

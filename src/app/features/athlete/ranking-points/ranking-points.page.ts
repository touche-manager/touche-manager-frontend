import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule }  from '@angular/common';
import { RouterModule }  from '@angular/router';
import { FormsModule }   from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { RankingEntryResponse } from '../../../core/models/tournament.models';
import { LabelPipe } from '../../../shared/pipes/label.pipe';
import { WEAPON_OPTIONS, CATEGORY_OPTIONS, GENDER_OPTIONS } from '../../../shared/utils/filter-options';
import { Weapon, TournamentCategory, Gender } from '../../../shared/utils/label.maps';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Component({
  selector: 'app-ranking-points-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LabelPipe],
  templateUrl: './ranking-points.page.html',
  styleUrls: ['./ranking-points.page.css'],
})
export class RankingPointsPageComponent implements OnInit {
  private readonly http = inject(HttpClient);

  // ── Filters ────────────────────────────────────────────────────────
  filterCategory: TournamentCategory | '' = '';
  filterGender:   Gender | ''             = '';
  filterWeapon:   Weapon | ''             = '';

  readonly categories = CATEGORY_OPTIONS;
  readonly genders    = GENDER_OPTIONS;
  readonly weapons    = WEAPON_OPTIONS;

  // ── State ──────────────────────────────────────────────────────────
  readonly loading     = signal(false);
  readonly searched    = signal(false);
  readonly error       = signal<string | null>(null);
  readonly rankings    = signal<RankingEntryResponse[]>([]);
  readonly expandedIds = signal<Set<number>>(new Set());

  ngOnInit(): void {
    // Auto-load if all three required filters already have a default
    // (they don't — user must select discipline)
  }

  search(): void {
    this.loading.set(true);
    this.error.set(null);
    this.searched.set(true);

    let params = new HttpParams();
    if (this.filterCategory) params = params.set('category', this.filterCategory);
    if (this.filterGender)   params = params.set('gender',   this.filterGender);
    if (this.filterWeapon)   params = params.set('weapon',   this.filterWeapon);

    this.http.get<ApiResponse<RankingEntryResponse[]>>(
      `${environment.apiUrl}/rankings/points`, { params }
    ).subscribe({
      next: (res) => { this.rankings.set(res.data ?? []); this.loading.set(false); },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudo calcular el ranking');
        this.rankings.set([]);
        this.loading.set(false);
      }
    });
  }

  toggleExpanded(id: number): void {
    const s = new Set(this.expandedIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.expandedIds.set(s);
  }

  /** Points for the "kept" tournaments (not discarded) */
  keptPoints(entry: RankingEntryResponse): number[] {
    return entry.tournaments
      .filter(t => !t.discarded)
      .map(t => t.finalPoints);
  }
}

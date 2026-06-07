import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import {
  TournamentResultResponse, PodiumEntry, FinalStanding,
  WeaponLabels, CategoryLabels, GenderLabels,
  Weapon, TournamentCategory, TournamentGender
} from '../../../core/models/tournament.models';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

/** Extended gender map to handle both MALE/FEMALE and MASCULINO/FEMENINO from backend */
const GenderDisplayMap: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Femenino',
  MASCULINO: 'Masculino',
  FEMENINO: 'Femenino'
};

@Component({
  selector: 'app-rankings-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="flex flex-col gap-6 pb-6">

      <!-- Back link -->
      <a routerLink="/athlete" class="back-link">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
        Volver al panel
      </a>

      <!-- Header -->
      <div class="animate-fade-up">
        <h1 class="page-title">Rankings</h1>
        <p class="page-subtitle">Consultá los resultados de torneos finalizados por categoría, arma y fecha.</p>
      </div>

      <!-- ═══ Filters ═══════════════════════════════════════════════════ -->
      <div class="card p-6 animate-fade-up delay-100">
        <p class="text-[11px] font-bold uppercase tracking-widest text-touche-navy/40 mb-4">Filtros de búsqueda</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          <!-- Categoría -->
          <div>
            <label class="label" for="filter-category">Categoría</label>
            <select id="filter-category" class="input-field" [(ngModel)]="filterCategory">
              <option value="">Todas</option>
              @for (cat of categories; track cat.value) {
                <option [value]="cat.value">{{ cat.label }}</option>
              }
            </select>
          </div>

          <!-- Sexo -->
          <div>
            <label class="label" for="filter-gender">Sexo</label>
            <select id="filter-gender" class="input-field" [(ngModel)]="filterGender">
              <option value="">Todos</option>
              @for (g of genders; track g.value) {
                <option [value]="g.value">{{ g.label }}</option>
              }
            </select>
          </div>

          <!-- Arma -->
          <div>
            <label class="label" for="filter-weapon">Arma</label>
            <select id="filter-weapon" class="input-field" [(ngModel)]="filterWeapon">
              <option value="">Todas</option>
              @for (w of weapons; track w.value) {
                <option [value]="w.value">{{ w.label }}</option>
              }
            </select>
          </div>

          <!-- Fecha Desde -->
          <div>
            <label class="label" for="filter-date-from">Fecha Desde</label>
            <input id="filter-date-from" type="date" class="input-field" [(ngModel)]="filterDateFrom">
          </div>

          <!-- Fecha Hasta -->
          <div>
            <label class="label" for="filter-date-to">Fecha Hasta</label>
            <input id="filter-date-to" type="date" class="input-field" [(ngModel)]="filterDateTo">
          </div>

          <!-- Search button -->
          <div class="flex items-end">
            <button class="btn-navy w-full" (click)="search()" [disabled]="loading()">
              @if (loading()) {
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Buscando…
              } @else {
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
                Buscar
              }
            </button>
          </div>

        </div>
      </div>

      <!-- ═══ Loading ════════════════════════════════════════════════════ -->
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
          <svg class="animate-spin h-10 w-10 text-touche-celeste" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <p class="text-touche-navy/60 text-sm font-medium">Cargando resultados…</p>
        </div>
      }

      <!-- ═══ Error ══════════════════════════════════════════════════════ -->
      @if (error()) {
        <div class="alert-danger shadow-card animate-fade-up">
          <p class="text-sm font-bold">Error</p>
          <p class="text-xs mt-0.5 opacity-80">{{ error() }}</p>
        </div>
      }

      <!-- ═══ Empty state ════════════════════════════════════════════════ -->
      @if (!loading() && searched() && results().length === 0 && !error()) {
        <div class="card p-10 text-center animate-fade-up">
          <div class="flex h-16 w-16 items-center justify-center rounded-full
                      bg-slate-100 border border-slate-200 mx-auto mb-4">
            <svg class="h-7 w-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p class="text-touche-navy font-bold text-lg mb-1">Sin resultados</p>
          <p class="text-slate-500 text-sm">No se encontraron torneos finalizados con los filtros seleccionados.</p>
        </div>
      }

      <!-- ═══ Results ════════════════════════════════════════════════════ -->
      @if (!loading() && results().length > 0) {
        <div class="flex flex-col gap-4">
          <p class="text-[11px] font-bold uppercase tracking-widest text-touche-navy/40">
            {{ results().length }} torneo{{ results().length !== 1 ? 's' : '' }} encontrado{{ results().length !== 1 ? 's' : '' }}
          </p>

          @for (t of results(); track t.tournamentId; let i = $index) {
            <div class="card overflow-hidden animate-fade-up" [style.animation-delay]="(i * 50) + 'ms'">

              <!-- Tournament Header (clickable) -->
              <button
                class="w-full text-left px-6 py-5 flex items-center justify-between gap-4
                       hover:bg-slate-50/50 transition-colors duration-150 focus:outline-none"
                (click)="toggleExpanded(t.tournamentId)"
              >
                <div class="flex-1 min-w-0">
                  <h3 class="font-display text-lg font-bold text-touche-navy truncate">{{ t.name }}</h3>
                  <div class="flex items-center gap-2 mt-2 flex-wrap">
                    <span class="badge badge-info text-[10px]">{{ getWeaponLabel(t.weapon) }}</span>
                    <span class="badge badge-info text-[10px]">{{ getCategoryLabel(t.category) }}</span>
                    <span class="badge badge-info text-[10px]">{{ getGenderLabel(t.gender) }}</span>
                    <span class="text-xs text-slate-400 ml-1">📍 {{ t.location }}</span>
                    <span class="text-xs text-slate-400">📅 {{ t.date }}</span>
                  </div>
                </div>
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-slate-400 transition-transform duration-200"
                       [class.rotate-180]="expandedIds().has(t.tournamentId)"
                       fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </button>

              <!-- Expanded content -->
              @if (expandedIds().has(t.tournamentId)) {
                <div class="border-t border-slate-100 px-6 py-6 space-y-8 animate-fade-in">

                  <!-- Podium -->
                  @if (t.podium.length > 0) {
                    <section>
                      <h4 class="text-lg font-display font-bold text-touche-navy mb-4 text-center">🏅 Podio</h4>
                      <div class="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-6">

                        <!-- 2nd place -->
                        @if (getPodiumByRank(t, 2); as second) {
                          <div class="order-2 md:order-1 w-full md:w-48 bg-white rounded-2xl shadow-card p-6 text-center border-t-4 border-slate-400">
                            <div class="w-14 h-14 mx-auto rounded-full bg-slate-200 flex items-center justify-center mb-3">
                              <span class="text-2xl">🥈</span>
                            </div>
                            <p class="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">2° Puesto</p>
                            <p class="font-bold text-touche-navy text-lg">{{ second.fullName }}</p>
                            <p class="text-sm text-slate-500 mt-0.5">{{ second.club ?? '' }}</p>
                          </div>
                        }

                        <!-- 1st place -->
                        @if (getPodiumByRank(t, 1); as first) {
                          <div class="order-1 md:order-2 w-full md:w-56 bg-white rounded-2xl shadow-card-hover p-8 text-center border-t-4 border-touche-gold transform md:scale-110">
                            <div class="w-16 h-16 mx-auto rounded-full bg-touche-gold/20 flex items-center justify-center mb-3">
                              <span class="text-3xl">🥇</span>
                            </div>
                            <p class="text-touche-gold text-xs font-bold uppercase tracking-wider mb-1">Campeón</p>
                            <p class="font-bold text-touche-navy text-xl">{{ first.fullName }}</p>
                            <p class="text-sm text-slate-500 mt-0.5">{{ first.club ?? '' }}</p>
                          </div>
                        }

                        <!-- 3rd place(s) -->
                        @for (third of getPodiumByRankAll(t, 3); track third.athleteId) {
                          <div class="order-3 w-full md:w-44 bg-white rounded-2xl shadow-card p-5 text-center border-t-4 border-amber-600">
                            <div class="w-12 h-12 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-3">
                              <span class="text-xl">🥉</span>
                            </div>
                            <p class="text-amber-700 text-xs font-bold uppercase tracking-wider mb-1">3° Puesto</p>
                            <p class="font-bold text-touche-navy">{{ third.fullName }}</p>
                            <p class="text-xs text-slate-500 mt-0.5">{{ third.club ?? '' }}</p>
                          </div>
                        }

                      </div>
                    </section>
                  }

                  <!-- Standings table -->
                  @if (t.standings.length > 0) {
                    <section>
                      <h4 class="text-lg font-display font-bold text-touche-navy mb-4">📊 Clasificación General</h4>
                      <div class="card overflow-hidden">
                        <div class="overflow-x-auto">
                          <table class="w-full text-sm">
                            <thead>
                              <tr class="bg-touche-navy text-white text-xs uppercase tracking-wider">
                                <th class="px-4 py-3 text-left w-12">#</th>
                                <th class="px-4 py-3 text-left">Atleta</th>
                                <th class="px-4 py-3 text-left">Club</th>
                                <th class="px-4 py-3 text-center">A</th>
                                <th class="px-4 py-3 text-center">V</th>
                                <th class="px-4 py-3 text-center">D</th>
                                <th class="px-4 py-3 text-center">TA</th>
                                <th class="px-4 py-3 text-center">TR</th>
                                <th class="px-4 py-3 text-center">Ind.</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (s of t.standings; track s.athleteId) {
                                <tr class="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                                    [ngClass]="{'bg-amber-50': s.rank <= 3}">
                                  <td class="px-4 py-3 font-bold text-center">
                                    @if (s.rank === 1) { <span class="text-touche-gold">🥇</span> }
                                    @else if (s.rank === 2) { <span class="text-slate-400">🥈</span> }
                                    @else if (s.rank === 3) { <span class="text-amber-600">🥉</span> }
                                    @else { <span class="text-slate-400">{{ s.rank }}</span> }
                                  </td>
                                  <td class="px-4 py-3 font-semibold text-touche-navy">{{ s.fullName }}</td>
                                  <td class="px-4 py-3 text-slate-500">{{ s.club ?? '—' }}</td>
                                  <td class="px-4 py-3 text-center text-slate-600">{{ s.bouts }}</td>
                                  <td class="px-4 py-3 text-center font-bold text-emerald-600">{{ s.victories }}</td>
                                  <td class="px-4 py-3 text-center text-red-400">{{ s.defeats }}</td>
                                  <td class="px-4 py-3 text-center text-slate-600">{{ s.touchesScored }}</td>
                                  <td class="px-4 py-3 text-center text-slate-600">{{ s.touchesReceived }}</td>
                                  <td class="px-4 py-3 text-center font-bold"
                                      [ngClass]="s.indicator >= 0 ? 'text-emerald-600' : 'text-red-500'">
                                    {{ s.indicator >= 0 ? '+' : '' }}{{ s.indicator }}
                                  </td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </section>
                  }

                </div>
              }

            </div>
          }
        </div>
      }

    </div>
  `
})
export class RankingsPageComponent {
  private readonly http = inject(HttpClient);

  // ── Filter state ─────────────────────────────────────────────────
  filterCategory = '';
  filterGender = '';
  filterWeapon = '';
  filterDateFrom = '';
  filterDateTo = '';

  // ── Filter options ───────────────────────────────────────────────
  readonly categories: { value: TournamentCategory; label: string }[] = [
    { value: 'PRE_INFANTILE', label: 'Pre-Infantiles' },
    { value: 'INFANTILE',     label: 'Infantiles' },
    { value: 'PRE_CADET',     label: 'Pre-Cadetes' },
    { value: 'CADET',         label: 'Cadetes' },
    { value: 'JUNIOR',        label: 'Juveniles' },
    { value: 'SENIOR',        label: 'Mayores' },
    { value: 'VETERAN',       label: 'Veteranos' },
  ];

  readonly genders: { value: string; label: string }[] = [
    { value: 'MASCULINO', label: 'Masculino' },
    { value: 'FEMENINO',  label: 'Femenino' },
  ];

  readonly weapons: { value: Weapon; label: string }[] = [
    { value: 'FOIL',  label: 'Florete' },
    { value: 'EPEE',  label: 'Espada' },
    { value: 'SABRE', label: 'Sable' },
  ];

  // ── Reactive state ───────────────────────────────────────────────
  readonly loading  = signal(false);
  readonly searched = signal(false);
  readonly error    = signal<string | null>(null);
  readonly results  = signal<TournamentResultResponse[]>([]);
  readonly expandedIds = signal<Set<number>>(new Set());

  // ── Actions ──────────────────────────────────────────────────────
  search(): void {
    this.loading.set(true);
    this.error.set(null);
    this.searched.set(true);

    let params = new HttpParams();
    if (this.filterCategory) params = params.set('category', this.filterCategory);
    if (this.filterGender)   params = params.set('gender', this.filterGender);
    if (this.filterWeapon)   params = params.set('weapon', this.filterWeapon);
    if (this.filterDateFrom) params = params.set('dateFrom', this.filterDateFrom);
    if (this.filterDateTo)   params = params.set('dateTo', this.filterDateTo);

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

  // ── Label helpers ────────────────────────────────────────────────
  getWeaponLabel(weapon: string): string {
    return (WeaponLabels as Record<string, string>)[weapon] ?? weapon;
  }

  getCategoryLabel(category: string): string {
    return (CategoryLabels as Record<string, string>)[category] ?? category;
  }

  getGenderLabel(gender: string): string {
    return GenderDisplayMap[gender] ?? gender;
  }

  getPodiumByRank(t: TournamentResultResponse, rank: number): PodiumEntry | undefined {
    return t.podium.find(p => p.rank === rank);
  }

  getPodiumByRankAll(t: TournamentResultResponse, rank: number): PodiumEntry[] {
    return t.podium.filter(p => p.rank === rank);
  }
}

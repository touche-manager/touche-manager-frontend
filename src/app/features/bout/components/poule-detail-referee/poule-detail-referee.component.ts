import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { PouleResponse, BoutResponse } from '../../../../core/models/tournament.models';

interface ApiResponse<T> { success: boolean; data: T; }

@Component({
  selector: 'app-poule-detail-referee',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full animate-fade-up">
      <!-- Back button + title -->
      <div class="flex items-center gap-4 mb-8">
        <button (click)="goBack()" class="text-touche-navy hover:bg-slate-100 transition-colors p-2 rounded-lg flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          @if (poule()) {
            <h1 class="page-title">
              Poule {{ poule()!.number }}
            </h1>
            <p class="page-subtitle">
              {{ poule()!.tournamentName }} &mdash; {{ poule()!.finishedBouts }} / {{ poule()!.totalBouts }} asaltos completados
            </p>
          } @else {
            <h1 class="page-title">Cargando...</h1>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-10 w-10 border-4 border-touche-celeste border-t-transparent"></div>
        </div>
      }

      @if (!loading() && poule()) {
        <!-- Progress bar -->
        <div class="mb-6 bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
          <div class="flex justify-between text-sm mb-2">
            <span class="text-slate-500 font-semibold">Progreso de la Poule</span>
            <span class="text-touche-navy font-bold">{{ poule()!.finishedBouts }} / {{ poule()!.totalBouts }}</span>
          </div>
          <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-touche-celeste rounded-full transition-all duration-500"
              [style.width.%]="progress()"
            ></div>
          </div>
        </div>

        <!-- Athletes list -->
        <div class="mb-6 bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
          <h2 class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Atletas en esta poule</h2>
          <div class="flex flex-wrap gap-2">
            @for (athlete of poule()!.athletes; track athlete.id) {
              <span class="px-3 py-1.5 bg-touche-celeste/15 border border-touche-celeste/20 rounded-full text-sm text-touche-navy font-semibold">
                {{ athlete.fullName }}
              </span>
            }
          </div>
        </div>

        <!-- Bouts list -->
        <div class="space-y-3">
          <h2 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Asaltos</h2>
          @for (bout of poule()!.bouts; track bout.id) {
            <div
              class="bg-white border rounded-2xl p-5 transition-all shadow-sm"
              [class]="boutCardClass(bout.status)"
            >
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <!-- Athletes + Score -->
                <div class="flex items-center gap-4 flex-1 min-w-0">
                  <!-- Left athlete -->
                  <div class="text-center min-w-0 flex-1">
                    <p class="font-bold text-touche-navy truncate">{{ bout.athleteLeft.firstName }} {{ bout.athleteLeft.lastName }}</p>
                    @if (bout.status === 'FINISHED') {
                      <p class="text-3xl font-black mt-1"
                         [class]="bout.winnerId === bout.athleteLeft.id ? 'text-touche-gold' : 'text-slate-305'">
                        {{ bout.scoreLeft }}
                      </p>
                    }
                  </div>

                  <div class="text-slate-400 font-bold text-sm flex-shrink-0">vs</div>

                  <!-- Right athlete -->
                  <div class="text-center min-w-0 flex-1">
                    @if (bout.athleteRight) {
                      <p class="font-bold text-touche-navy truncate">{{ bout.athleteRight.firstName }} {{ bout.athleteRight.lastName }}</p>
                      @if (bout.status === 'FINISHED') {
                        <p class="text-3xl font-black mt-1"
                           [class]="bout.winnerId === bout.athleteRight.id ? 'text-touche-gold' : 'text-slate-305'">
                          {{ bout.scoreRight }}
                        </p>
                      }
                    } @else {
                      <p class="font-bold text-slate-350 italic truncate">BYE</p>
                    }
                  </div>
                </div>

                <!-- Status + Action -->
                <div class="flex items-center gap-3 flex-shrink-0">
                  @if (bout.status === 'FINISHED') {
                    <span class="badge badge-success">Finalizado</span>
                  } @else if (bout.status === 'IN_PROGRESS') {
                    <span class="badge badge-warning animate-pulse">En curso</span>
                    <button
                      [id]="'btn-score-' + bout.id"
                      (click)="scoreBout(bout.id)"
                      class="btn-navy text-xs px-3.5 py-2"
                    >
                      Continuar
                    </button>
                  } @else {
                    <span class="badge badge-neutral">Pendiente</span>
                    <button
                      [id]="'btn-start-' + bout.id"
                      (click)="scoreBout(bout.id)"
                      class="btn-ghost text-xs px-3.5 py-2"
                    >
                      Arbitrar
                    </button>
                  }
                </div>
              </div>

              @if (bout.status === 'FINISHED' && bout.winnerId) {
                <div class="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                  Ganador: <span class="text-touche-gold font-bold">
                    {{ bout.winnerId === bout.athleteLeft.id
                        ? (bout.athleteLeft.firstName + ' ' + bout.athleteLeft.lastName)
                        : (bout.athleteRight ? bout.athleteRight.firstName + ' ' + bout.athleteRight.lastName : '—') }}
                  </span>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class PouleDetailRefereeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  readonly poule = signal<PouleResponse | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const pouleId = +this.route.snapshot.paramMap.get('pouleId')!;
    this.http.get<ApiResponse<PouleResponse>>(`${environment.apiUrl}/poules/${pouleId}`)
      .pipe(map(r => r.data))
      .subscribe({
        next: (data) => { this.poule.set(data); this.loading.set(false); },
        error: () => this.loading.set(false)
      });
  }

  progress(): number {
    const p = this.poule();
    if (!p || p.totalBouts === 0) return 0;
    return Math.round((p.finishedBouts / p.totalBouts) * 100);
  }

  scoreBout(boutId: number): void {
    this.router.navigate(['/bout', boutId, 'score']);
  }

  goBack(): void {
    const poule = this.poule();
    if (poule) this.router.navigate(['/bout', poule.tournamentId, 'poules']);
    else this.router.navigate(['/bout']);
  }

  boutCardClass(status: string): string {
    if (status === 'FINISHED') return 'border-emerald-100 bg-slate-50/50 opacity-80';
    if (status === 'IN_PROGRESS') return 'border-amber-200 bg-amber-50/5';
    return 'border-slate-150 hover:border-slate-300';
  }
}

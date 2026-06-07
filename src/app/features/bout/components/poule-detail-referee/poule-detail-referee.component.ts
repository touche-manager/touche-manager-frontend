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
    <div class="min-h-screen bg-touche-navy p-4 md:p-8">
      <!-- Back button + title -->
      <div class="flex items-center gap-4 mb-8">
        <button (click)="goBack()" class="text-touche-celeste hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          @if (poule()) {
            <h1 class="text-2xl font-bold text-white">
              Poule {{ poule()!.number }} &mdash; {{ poule()!.tournamentName }}
            </h1>
            <p class="text-sm text-touche-celeste mt-0.5">
              {{ poule()!.finishedBouts }} / {{ poule()!.totalBouts }} asaltos completados
            </p>
          } @else {
            <h1 class="text-2xl font-bold text-white">Cargando...</h1>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-touche-celeste border-t-transparent"></div>
        </div>
      }

      @if (!loading() && poule()) {
        <!-- Progress bar -->
        <div class="mb-6 bg-white/5 border border-white/10 rounded-2xl p-5">
          <div class="flex justify-between text-sm mb-2">
            <span class="text-white/60">Progreso de la Poule</span>
            <span class="text-touche-celeste font-medium">{{ poule()!.finishedBouts }} / {{ poule()!.totalBouts }}</span>
          </div>
          <div class="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-touche-celeste to-blue-400 rounded-full transition-all duration-500"
              [style.width.%]="progress()"
            ></div>
          </div>
        </div>

        <!-- Athletes list -->
        <div class="mb-6 bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 class="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Atletas en esta poule</h2>
          <div class="flex flex-wrap gap-2">
            @for (athlete of poule()!.athletes; track athlete.id) {
              <span class="px-3 py-1.5 bg-touche-celeste/10 border border-touche-celeste/30 rounded-full text-sm text-touche-celeste">
                {{ athlete.fullName }}
              </span>
            }
          </div>
        </div>

        <!-- Bouts list -->
        <div class="space-y-3">
          <h2 class="text-sm font-semibold text-white/60 uppercase tracking-wider">Asaltos</h2>
          @for (bout of poule()!.bouts; track bout.id) {
            <div
              class="bg-white/5 border rounded-2xl p-5 transition-all"
              [class]="boutCardClass(bout.status)"
            >
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <!-- Athletes + Score -->
                <div class="flex items-center gap-4 flex-1 min-w-0">
                  <!-- Left athlete -->
                  <div class="text-center min-w-0 flex-1">
                    <p class="font-bold text-white truncate">{{ bout.athleteLeft.firstName }} {{ bout.athleteLeft.lastName }}</p>
                    @if (bout.status === 'FINISHED') {
                      <p class="text-3xl font-black mt-1"
                         [class]="bout.winnerId === bout.athleteLeft.id ? 'text-touche-gold' : 'text-white/40'">
                        {{ bout.scoreLeft }}
                      </p>
                    }
                  </div>

                  <div class="text-white/40 font-medium text-sm flex-shrink-0">vs</div>

                  <!-- Right athlete -->
                  <div class="text-center min-w-0 flex-1">
                    @if (bout.athleteRight) {
                      <p class="font-bold text-white truncate">{{ bout.athleteRight.firstName }} {{ bout.athleteRight.lastName }}</p>
                      @if (bout.status === 'FINISHED') {
                        <p class="text-3xl font-black mt-1"
                           [class]="bout.winnerId === bout.athleteRight.id ? 'text-touche-gold' : 'text-white/40'">
                          {{ bout.scoreRight }}
                        </p>
                      }
                    } @else {
                      <p class="font-bold text-white/30 italic truncate">BYE</p>
                    }
                  </div>
                </div>

                <!-- Status + Action -->
                <div class="flex items-center gap-3 flex-shrink-0">
                  @if (bout.status === 'FINISHED') {
                    <span class="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400">Finalizado</span>
                  } @else if (bout.status === 'IN_PROGRESS') {
                    <span class="text-xs px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 animate-pulse">En curso</span>
                    <button
                      [id]="'btn-score-' + bout.id"
                      (click)="scoreBout(bout.id)"
                      class="px-4 py-2 rounded-xl bg-touche-celeste text-touche-navy font-bold text-sm hover:bg-touche-celeste/80 transition-colors"
                    >
                      Continuar
                    </button>
                  } @else {
                    <span class="text-xs px-3 py-1 rounded-full bg-white/10 text-white/40">Pendiente</span>
                    <button
                      [id]="'btn-start-' + bout.id"
                      (click)="scoreBout(bout.id)"
                      class="px-4 py-2 rounded-xl border border-touche-celeste/50 text-touche-celeste font-bold text-sm hover:bg-touche-celeste/10 transition-colors"
                    >
                      Arbitrar
                    </button>
                  }
                </div>
              </div>

              @if (bout.status === 'FINISHED' && bout.winnerId) {
                <div class="mt-3 pt-3 border-t border-white/10 text-sm text-white/50">
                  Ganador: <span class="text-touche-gold font-medium">
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
    if (status === 'FINISHED') return 'border-green-500/20 opacity-70';
    if (status === 'IN_PROGRESS') return 'border-yellow-500/40';
    return 'border-white/10 hover:border-white/20';
  }
}

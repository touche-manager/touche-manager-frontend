import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { PouleResponse, BoutResponse } from '../../../../core/models/tournament.models';
import { PouleService } from '../../../tournament/services/poule.service';

interface ApiResponse<T> { success: boolean; data: T; }

@Component({
  selector: 'app-poule-detail-referee',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="w-full animate-fade-up">
      <!-- Back button + title -->
      <div class="flex items-center gap-4 mb-8">
        <button (click)="goBack()" class="text-touche-navy hover:bg-slate-100 transition-colors p-2 rounded-xl flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          @if (poule()) {
            <h1 class="page-title text-2xl md:text-3xl font-black text-touche-navy">
              Poule #{{ poule()!.number }}
            </h1>
            <p class="page-subtitle text-slate-500 mt-1">
              {{ poule()!.tournamentName }} &mdash; {{ poule()!.finishedBouts }} de {{ poule()!.totalBouts }} asaltos completados
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
          <div class="flex justify-between text-xs font-semibold mb-2">
            <span class="text-slate-400 uppercase tracking-wider">Progreso de la Poule</span>
            <span class="text-touche-navy font-bold">{{ poule()!.finishedBouts }} / {{ poule()!.totalBouts }} ({{ progress() }}%)</span>
          </div>
          <div class="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              class="h-full bg-touche-celeste rounded-full transition-all duration-500"
              [style.width.%]="progress()"
            ></div>
          </div>
        </div>

        <!-- ── Attendance Checklist (only when PENDING) ─────────────────────── -->
        @if (poule()!.status === 'PENDING') {
          <div class="mb-6 bg-white border border-slate-150 rounded-2xl p-6 shadow-sm">
            <div class="flex items-center gap-2 mb-4">
              <div class="p-2 rounded-lg bg-touche-celeste/10 text-touche-navy">
                <svg class="w-5 h-5 text-touche-navy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/>
                </svg>
              </div>
              <div>
                <h3 class="font-bold text-touche-navy text-sm">Control de Asistencia</h3>
                <p class="text-xs text-slate-400 mt-0.5">Confirmá la presencia de los atletas presentes en pista para comenzar la poule.</p>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              @for (athlete of poule()!.athletes; track athlete.id) {
                <label 
                  class="flex items-center justify-between p-3 rounded-xl border cursor-pointer select-none transition-all duration-150"
                  [class.border-touche-celeste]="attendance()[athlete.id]"
                  [class.bg-sky-50]="attendance()[athlete.id]"
                  [class.border-slate-200]="!attendance()[athlete.id]"
                  [class.bg-slate-50]="!attendance()[athlete.id]"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <input 
                      type="checkbox" 
                      [checked]="attendance()[athlete.id]"
                      (change)="toggleAttendance(athlete.id)"
                      class="w-4.5 h-4.5 rounded border-slate-300 text-touche-navy focus:ring-touche-celeste transition"
                    />
                    <span 
                      class="text-sm font-semibold truncate transition-colors"
                      [class.text-touche-navy]="attendance()[athlete.id]"
                      [class.text-slate-400]="!attendance()[athlete.id]"
                    >
                      {{ athlete.fullName }}
                    </span>
                  </div>
                  @if (athlete.club) {
                    <span 
                      class="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold border transition-colors flex-shrink-0"
                      [class.bg-white]="attendance()[athlete.id]"
                      [class.border-slate-200]="attendance()[athlete.id]"
                      [class.text-slate-500]="attendance()[athlete.id]"
                      [class.bg-slate-100]="!attendance()[athlete.id]"
                      [class.border-slate-200]="!attendance()[athlete.id]"
                      [class.text-slate-400]="!attendance()[athlete.id]"
                      [title]="athlete.club"
                    >
                      {{ getClubAbbreviation(athlete.club) }}
                    </span>
                  }
                </label>
              }
            </div>

            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-slate-100">
              <div class="text-xs text-slate-400 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <span>Se requieren mínimo 2 atletas presentes para iniciar.</span>
              </div>
              <button
                id="btn-start-poule"
                (click)="startPoule()"
                [disabled]="isStarting() || !hasMinimumPresent()"
                class="btn-navy px-6 py-2.5 flex items-center gap-2 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (isStarting()) {
                  <span class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Iniciando poule...
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Comenzar Poule
                }
              </button>
            </div>
          </div>
        } @else {
          <!-- Read-only Athletes List (when IN_PROGRESS or FINISHED) -->
          <div class="mb-6 bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
            <h2 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Atletas de la Poule</h2>
            <div class="flex flex-wrap gap-2">
              @for (athlete of poule()!.athletes; track athlete.id) {
                <span class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-sm text-touche-navy font-semibold">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200"></span>
                  <span>{{ athlete.fullName }}</span>
                  @if (athlete.club) {
                    <span 
                      class="text-[10px] text-slate-400 font-mono font-semibold cursor-help"
                      [title]="athlete.club"
                    >
                      ({{ getClubAbbreviation(athlete.club) }})
                    </span>
                  }
                </span>
              }
            </div>
          </div>
        }

        <!-- Bouts List -->
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Asaltos en orden de competencia</h2>
            <span class="text-xs text-slate-400">Fórmula oficial FIE</span>
          </div>

          <!-- Poule Pending Warning Banner -->
          @if (poule()!.status === 'PENDING') {
            <div class="alert-warning py-3 px-4 rounded-xl flex items-center gap-3 text-xs">
              <svg class="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              <span>La poule no ha comenzado. Debés confirmar la asistencia de los atletas para habilitar el arbitraje.</span>
            </div>
          }

          <div class="grid grid-cols-1 gap-4">
            @for (bout of poule()!.bouts; track bout.id) {
              @let isNext = isNextBout(bout.id);
              
              <div
                class="bg-white border rounded-2xl p-5 transition-all shadow-sm flex flex-col gap-3"
                [class]="boutCardClass(bout.status, isNext)"
              >
                <!-- Bout Header info (Order + Piste) -->
                <div class="flex justify-between items-center text-xs font-semibold text-slate-400 border-b border-slate-50 pb-2">
                  <span class="text-touche-navy flex items-center gap-1.5">
                    @if (isNext && poule()!.status === 'IN_PROGRESS') {
                      <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-touche-celeste text-touche-navy font-bold text-[9px] uppercase tracking-wider animate-pulse">Siguiente</span>
                    }
                    Asalto #{{ bout.boutOrder }}
                  </span>
                  @if (bout.piste) {
                    <span class="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-bold">Pista: {{ bout.piste }}</span>
                  }
                </div>

                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <!-- Athletes + Score -->
                  <div class="flex items-center gap-4 flex-1 min-w-0">
                    <!-- Left athlete -->
                    <div class="text-center min-w-0 flex-1">
                      <p 
                        class="font-bold text-sm truncate"
                        [class]="bout.status === 'FINISHED' && bout.winnerId === bout.athleteLeft.id ? 'text-touche-navy' : 'text-slate-700'"
                      >
                        {{ bout.athleteLeft.firstName }} {{ bout.athleteLeft.lastName }}
                      </p>
                      <span class="text-[10px] text-slate-400 font-semibold" [title]="bout.athleteLeft.club || ''">
                        {{ getClubAbbreviation(bout.athleteLeft.club) }}
                      </span>
                      
                      @if (bout.status !== 'PENDING') {
                        <p class="text-3xl font-black mt-2 transition-all"
                           [class]="bout.status === 'FINISHED' && bout.winnerId === bout.athleteLeft.id ? 'text-touche-gold font-extrabold scale-110' : 'text-touche-navy'">
                          {{ bout.scoreLeft }}
                        </p>
                      }
                    </div>

                    <div class="text-slate-300 font-extrabold text-xs flex-shrink-0">VS</div>

                    <!-- Right athlete -->
                    <div class="text-center min-w-0 flex-1">
                      @if (bout.athleteRight) {
                        <p 
                          class="font-bold text-sm truncate"
                          [class]="bout.status === 'FINISHED' && bout.winnerId === bout.athleteRight.id ? 'text-touche-navy' : 'text-slate-700'"
                        >
                          {{ bout.athleteRight.firstName }} {{ bout.athleteRight.lastName }}
                        </p>
                        <span class="text-[10px] text-slate-400 font-semibold" [title]="bout.athleteRight.club || ''">
                          {{ getClubAbbreviation(bout.athleteRight.club) }}
                        </span>
                        
                        @if (bout.status !== 'PENDING') {
                          <p class="text-3xl font-black mt-2 transition-all"
                             [class]="bout.status === 'FINISHED' && bout.winnerId === bout.athleteRight.id ? 'text-touche-gold font-extrabold scale-110' : 'text-touche-navy'">
                            {{ bout.scoreRight }}
                          </p>
                        }
                      } @else {
                        <p class="font-bold text-slate-350 italic truncate">BYE</p>
                      }
                    </div>
                  </div>

                  <!-- Status + Action -->
                  <div class="flex items-center gap-3 flex-shrink-0 justify-end sm:justify-start">
                    @if (bout.status === 'FINISHED') {
                      <span class="badge badge-success text-[10px]">Finalizado</span>
                    } @else if (bout.status === 'IN_PROGRESS') {
                      <span class="badge badge-warning animate-pulse text-[10px]">En curso</span>
                      <button
                        [id]="'btn-score-' + bout.id"
                        (click)="scoreBout(bout.id)"
                        class="btn-navy text-xs px-4 py-2"
                      >
                        Continuar
                      </button>
                    } @else {
                      <span class="badge badge-neutral text-[10px]">Pendiente</span>
                      
                      @if (poule()!.status === 'IN_PROGRESS') {
                        <button
                          [id]="'btn-start-' + bout.id"
                          (click)="scoreBout(bout.id)"
                          [class]="isNext ? 'btn-navy text-xs px-4 py-2 hover:scale-[1.02]' : 'btn-ghost text-xs px-4 py-2'"
                        >
                          Arbitrar
                        </button>
                      } @else {
                        <button
                          disabled
                          class="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-350 border border-slate-200 rounded-xl cursor-not-allowed opacity-60"
                          title="Iniciá la poule para arbitrar"
                        >
                          Arbitrar
                        </button>
                      }
                    }
                  </div>
                </div>

                @if (bout.status === 'FINISHED' && bout.winnerId) {
                  <div class="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span class="text-slate-400 font-medium">Ganador del asalto</span>
                    <span class="text-touche-gold font-bold flex items-center gap-1">
                      <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                      {{ getWinnerName(bout) }}
                    </span>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class PouleDetailRefereeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly pouleService = inject(PouleService);

  readonly poule = signal<PouleResponse | null>(null);
  readonly loading = signal(true);
  readonly isStarting = signal(false);
  
  // Track attendance
  readonly attendance = signal<Record<number, boolean>>({});

  ngOnInit(): void {
    const pouleId = +this.route.snapshot.paramMap.get('pouleId')!;
    this.http.get<ApiResponse<PouleResponse>>(`${environment.apiUrl}/poules/${pouleId}`)
      .pipe(map(r => r.data))
      .subscribe({
        next: (data) => { 
          this.poule.set(data); 
          this.loading.set(false); 
          
          // Initialize attendance
          const initialAttendance: Record<number, boolean> = {};
          data.athletes.forEach(a => {
            initialAttendance[a.id] = true; // default present
          });
          this.attendance.set(initialAttendance);
        },
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

  toggleAttendance(athleteId: number): void {
    this.attendance.update(att => ({
      ...att,
      [athleteId]: !att[athleteId]
    }));
  }

  hasMinimumPresent(): boolean {
    const counts = Object.values(this.attendance()).filter(Boolean).length;
    return counts >= 2;
  }

  startPoule(): void {
    const poule = this.poule();
    if (!poule) return;
    this.isStarting.set(true);
    this.pouleService.startPoule(poule.id).subscribe({
      next: (updated) => {
        this.poule.set(updated);
        this.isStarting.set(false);
      },
      error: (err) => {
        console.error('Error al iniciar la poule', err);
        alert(err?.error?.message || 'No se pudo iniciar la poule. Verificá que estés asignado como árbitro.');
        this.isStarting.set(false);
      }
    });
  }

  goBack(): void {
    const poule = this.poule();
    if (poule) this.router.navigate(['/bout', poule.tournamentId, 'poules']);
    else this.router.navigate(['/bout']);
  }

  getClubAbbreviation(club: string | null): string {
    if (!club) return '—';
    const clean = club.trim();
    if (clean.length <= 4) return clean.toUpperCase();
    
    const stopWords = ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'para', 'con', 'a', 'association', 'asociacion', 'club', 'federacion', 'fencing', 'esgrima'];
    const words = clean.split(/[\s,\-]+/)
      .filter(w => w.length > 1 && !stopWords.includes(w.toLowerCase()));
      
    if (words.length >= 2) {
      return words.map(w => w[0]).join('').toUpperCase();
    }
    return clean.substring(0, 3).toUpperCase();
  }

  isNextBout(boutId: number): boolean {
    const p = this.poule();
    if (!p) return false;
    // Find the first non-finished bout ID
    const nextBout = p.bouts.find(b => b.status !== 'FINISHED');
    return nextBout ? nextBout.id === boutId : false;
  }

  getWinnerName(bout: BoutResponse): string {
    if (bout.winnerId === bout.athleteLeft.id) {
      return bout.athleteLeft.firstName + ' ' + bout.athleteLeft.lastName;
    }
    if (bout.athleteRight && bout.winnerId === bout.athleteRight.id) {
      return bout.athleteRight.firstName + ' ' + bout.athleteRight.lastName;
    }
    return '—';
  }

  boutCardClass(status: string, isNext: boolean): string {
    const base = 'border transition-all duration-150 ';
    if (status === 'FINISHED') {
      return base + 'border-slate-100 bg-slate-50/40 opacity-75';
    }
    if (status === 'IN_PROGRESS') {
      return base + 'border-amber-200 bg-amber-50/5 ring-1 ring-amber-200 shadow-md';
    }
    if (isNext && this.poule()?.status === 'IN_PROGRESS') {
      return base + 'border-touche-celeste/60 bg-touche-celeste/5 ring-1 ring-touche-celeste/20';
    }
    return base + 'border-slate-150 hover:border-slate-250';
  }
}

import {
  Component, OnInit, OnDestroy, inject, signal, computed
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BoutService } from '../../services/bout.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import {
  BoutResponse, BoutEventRequest, EventSide, EventType, BoutStatus, BoutFormatLabels
} from '../../../../core/models/bout.models';

@Component({
  selector: 'app-bout-scorer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col">

      <!-- Top bar -->
      <div class="bg-white border-b border-slate-150 px-4 py-4 flex items-center justify-between shadow-sm">
        <button (click)="goBack()" class="text-touche-navy hover:bg-slate-100 transition-colors p-2 rounded-xl flex-shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="text-center">
          <p class="text-touche-navy font-bold text-sm md:text-base">{{ bout()?.tournamentName }}</p>
          <p class="text-slate-400 text-xs mt-0.5 font-semibold">
            {{ formatLabel() }} &middot; Período {{ bout()?.currentPeriod }}/{{ bout()?.maxPeriods }}
          </p>
          @if (bout()?.piste) {
            <p class="mt-1">
              <span class="bg-touche-celeste/15 text-touche-navy font-bold text-[10px] px-2 py-0.5 rounded border border-touche-celeste/20">
                Pista: {{ bout()?.piste }}
              </span>
            </p>
          }
        </div>
        <div class="w-10"></div>
      </div>

      @if (loading()) {
        <div class="flex-grow flex items-center justify-center">
          <div class="animate-spin rounded-full h-10 w-10 border-4 border-touche-celeste border-t-transparent"></div>
        </div>
      }

      @if (!loading() && bout()) {
        <div class="flex-grow flex flex-col p-4 gap-5 max-w-3xl mx-auto w-full">

          <!-- Scoreboard -->
          <div class="bg-white border border-slate-150 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <!-- Left athlete -->
            <div class="flex flex-col items-center flex-1 min-w-0">
              <div class="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center font-bold text-red-500 text-lg shadow-sm mb-3">
                {{ bout()!.athleteLeft.firstName.charAt(0) }}
              </div>
              <p class="text-touche-navy font-bold text-center text-sm md:text-base leading-snug truncate w-full">
                {{ bout()!.athleteLeft.firstName }} {{ bout()!.athleteLeft.lastName }}
              </p>
              @if (bout()!.athleteLeft.club) {
                <span 
                  class="text-[9px] text-slate-400 font-mono font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md mt-1.5 cursor-help"
                  [title]="bout()!.athleteLeft.club ?? ''"
                >
                  {{ getClubAbbreviation(bout()!.athleteLeft.club) }}
                </span>
              }
            </div>

            <!-- Scores + Timer -->
            <div class="flex flex-col items-center justify-center gap-2 px-4 flex-shrink-0">
              <div class="flex items-center gap-3">
                <span class="text-5xl md:text-7xl font-black text-touche-navy transition-all" [class.text-touche-gold]="isLeading('LEFT')">
                  {{ bout()!.scoreLeft }}
                </span>
                <span class="text-2xl text-slate-200 font-bold px-1">:</span>
                <span class="text-5xl md:text-7xl font-black text-touche-navy transition-all" [class.text-touche-gold]="isLeading('RIGHT')">
                  {{ bout()!.scoreRight }}
                </span>
              </div>
              <!-- Timer -->
              <div class="bg-slate-50 border border-slate-200 rounded-2xl px-6 py-2.5 text-center shadow-inner">
                <span class="text-2xl font-mono font-black transition-colors" [class]="timerColorClass()">
                  {{ formattedTime() }}
                </span>
              </div>
              <!-- Target -->
              <p class="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Meta: {{ bout()!.touchesTarget }} toques</p>
            </div>

            <!-- Right athlete -->
            <div class="flex flex-col items-center flex-1 min-w-0">
              @if (bout()!.athleteRight) {
                <div class="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center font-bold text-emerald-500 text-lg shadow-sm mb-3">
                  {{ bout()!.athleteRight!.firstName.charAt(0) }}
                </div>
                <p class="text-touche-navy font-bold text-center text-sm md:text-base leading-snug truncate w-full">
                  {{ bout()!.athleteRight!.firstName }} {{ bout()!.athleteRight!.lastName }}
                </p>
                @if (bout()!.athleteRight!.club) {
                  <span 
                    class="text-[9px] text-slate-400 font-mono font-bold bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md mt-1.5 cursor-help"
                    [title]="bout()!.athleteRight!.club ?? ''"
                  >
                    {{ getClubAbbreviation(bout()!.athleteRight!.club) }}
                  </span>
                }
              } @else {
                <div class="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center font-bold text-slate-400 text-lg shadow-sm mb-3">
                  —
                </div>
                <p class="text-slate-400 font-bold text-center text-sm italic">BYE</p>
              }
            </div>
          </div>

          <!-- Winner banner -->
          @if (bout()!.status === 'FINISHED') {
            <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center flex flex-col items-center justify-center gap-1 shadow-sm">
              <p class="text-touche-gold font-black text-base flex items-center gap-1.5">
                <svg class="w-5 h-5 fill-current" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
                Combate Finalizado
              </p>
              @if (bout()!.winnerId) {
                <p class="text-slate-700 text-sm font-semibold mt-1">
                  Ganador: <span class="text-touche-navy font-bold">{{ winnerName() }}</span>
                  @if (bout()!.priority) {
                    <span class="text-slate-400 text-xs ml-1.5 font-normal">(por prioridad)</span>
                  }
                </p>
              }
            </div>
          }

          <!-- Controls (only if active) -->
          @if (bout()!.status !== 'FINISHED') {
            <div class="grid grid-cols-2 gap-4">

              <!-- Left fencer controls -->
              <div class="space-y-3">
                <p class="text-red-500 text-[10px] font-bold uppercase tracking-wider text-center truncate">
                  {{ bout()!.athleteLeft.firstName }}
                </p>
                <button
                  id="btn-touche-left"
                  (click)="recordEvent('LEFT', 'TOUCHE')"
                  [disabled]="recording() || bout()!.status === 'PENDING'"
                  class="w-full py-6 rounded-2xl bg-red-50 hover:bg-red-100 active:scale-95 text-red-600 font-black text-lg transition-all border border-red-200 disabled:opacity-40 shadow-sm"
                >
                  Touché
                </button>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    id="btn-penalty-left"
                    (click)="recordEvent('LEFT', 'PENALTY')"
                    [disabled]="recording() || bout()!.status === 'PENDING'"
                    class="py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 active:scale-95 text-orange-600 text-xs font-bold transition-all border border-orange-200 disabled:opacity-40"
                  >
                    Penalidad
                  </button>
                  <button
                    id="btn-card-left"
                    (click)="recordEvent('LEFT', 'CARD')"
                    [disabled]="recording() || bout()!.status === 'PENDING'"
                    class="py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-700 text-xs font-bold transition-all border border-amber-200 disabled:opacity-40"
                  >
                    Tarjeta
                  </button>
                </div>
              </div>

              <!-- Right fencer controls -->
              <div class="space-y-3">
                <p class="text-emerald-500 text-[10px] font-bold uppercase tracking-wider text-center truncate">
                  {{ bout()!.athleteRight?.firstName ?? '' }}
                </p>
                <button
                  id="btn-touche-right"
                  (click)="recordEvent('RIGHT', 'TOUCHE')"
                  [disabled]="recording() || bout()!.status === 'PENDING'"
                  class="w-full py-6 rounded-2xl bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-600 font-black text-lg transition-all border border-emerald-200 disabled:opacity-40 shadow-sm"
                >
                  Touché
                </button>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    id="btn-penalty-right"
                    (click)="recordEvent('RIGHT', 'PENALTY')"
                    [disabled]="recording() || bout()!.status === 'PENDING'"
                    class="py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 active:scale-95 text-orange-600 text-xs font-bold transition-all border border-orange-200 disabled:opacity-40"
                  >
                    Penalidad
                  </button>
                  <button
                    id="btn-card-right"
                    (click)="recordEvent('RIGHT', 'CARD')"
                    [disabled]="recording() || bout()!.status === 'PENDING'"
                    class="py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 active:scale-95 text-amber-700 text-xs font-bold transition-all border border-amber-200 disabled:opacity-40"
                  >
                    Tarjeta
                  </button>
                </div>
              </div>
            </div>

            <!-- Priority banner (when scores are tied) -->
            @if (bout()!.status === 'IN_PROGRESS' && bout()!.scoreLeft === bout()!.scoreRight && !bout()!.priority) {
              <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center flex flex-col items-center gap-3 shadow-sm animate-fade-in">
                <p class="text-amber-800 font-bold text-xs">⚠️ Puntaje empatado — Sortear prioridad para poder finalizar</p>
                <button
                  id="btn-draw-priority"
                  (click)="drawPriority()"
                  [disabled]="recording()"
                  class="btn-gold px-6 py-2.5 font-bold text-xs rounded-xl shadow active:scale-95 transition-all"
                >
                  🎲 Sortear Prioridad
                </button>
              </div>
            }

            @if (bout()!.priority) {
              <div class="bg-sky-50 border border-touche-celeste/30 rounded-2xl p-3 text-center shadow-sm">
                <p class="text-touche-navy text-xs font-semibold">
                  ⭐ Prioridad:
                  <strong [class]="bout()!.priority === 'LEFT' ? 'text-red-500' : 'text-emerald-600'">
                    {{ bout()!.priority === 'LEFT' ? (bout()!.athleteLeft.firstName + ' ' + bout()!.athleteLeft.lastName) : (bout()!.athleteRight?.firstName + ' ' + bout()!.athleteRight?.lastName) }}
                  </strong>
                </p>
              </div>
            }

            <!-- Start / Timer / Finish buttons -->
            <div class="flex gap-3 mt-4">
              @if (bout()!.status === 'PENDING') {
                <button
                  id="btn-notify-upcoming"
                  (click)="summonAthletes()"
                  [disabled]="summoning()"
                  class="py-3.5 px-4.5 rounded-2xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 font-bold text-base transition-all disabled:opacity-40 shadow-sm"
                  title="Notificar a los atletas que su combate comienza en 5 minutos"
                >
                  📣
                </button>
                <button
                  id="btn-start"
                  (click)="startBout()"
                  class="flex-1 py-3.5 rounded-2xl btn-navy hover:scale-[1.01] transition-all font-bold text-sm shadow-md"
                >
                  Iniciar Combate
                </button>
              }
              @if (bout()!.status === 'IN_PROGRESS') {
                <button
                  id="btn-timer-toggle"
                  (click)="toggleTimer()"
                  class="py-3.5 px-6 rounded-2xl font-bold text-base transition-all border shadow-sm"
                  [class]="timerRunning() ? 'bg-orange-50 border-orange-200 text-orange-600 hover:bg-orange-100' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'"
                >
                  {{ timerRunning() ? '⏸ Pausa' : '▶ Reanudar' }}
                </button>
                <button
                  id="btn-finish"
                  (click)="finishBout()"
                  class="flex-1 py-3.5 rounded-2xl btn-navy hover:scale-[1.01] text-white font-bold text-sm transition-all shadow-md"
                >
                  Finalizar Combate
                </button>
              }
            </div>
          }

          <!-- Event log (last 5) -->
          @if (bout()!.events.length > 0) {
            <div class="bg-white border border-slate-150 rounded-2xl p-5 shadow-sm">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-50 pb-2">Últimos eventos</h4>
              <div class="space-y-1">
                @for (event of lastEvents(); track event.id) {
                  <div class="flex items-center justify-between text-sm py-1.5 border-b border-slate-50/50 last:border-0">
                    <span [class]="event.side === 'LEFT' ? 'text-red-500' : 'text-emerald-600'" class="font-bold text-xs">
                      {{ event.side === 'LEFT' ? (bout()!.athleteLeft.firstName + ' ' + bout()!.athleteLeft.lastName) : (bout()!.athleteRight?.firstName + ' ' + bout()!.athleteRight?.lastName) }}
                    </span>
                    <span class="text-slate-600 font-semibold text-xs flex items-center gap-1.5">
                      {{ eventTypeLabel(event.eventType) }}
                      @if (event.scoreDelta > 0) {
                        <span class="text-touche-gold font-black bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">+{{ event.scoreDelta }}</span>
                      }
                    </span>
                  </div>
                }
              </div>
            </div>
          }

        </div>
      }
    </div>
  `
})
export class BoutScorerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly boutService = inject(BoutService);
  private readonly notificationService = inject(NotificationService);

  private boutId = 0;
  private tournamentId = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  readonly bout = signal<BoutResponse | null>(null);
  readonly loading = signal(true);
  readonly recording = signal(false);
  readonly timerRunning = signal(false);
  readonly summoning = signal(false);
  readonly localElapsed = signal(0); // seconds, local state

  readonly formattedTime = computed(() => {
    const s = this.localElapsed();
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  });

  readonly formatLabel = computed(() => {
    const f = this.bout()?.format;
    return f ? BoutFormatLabels[f] : '';
  });

  readonly lastEvents = computed(() => {
    const events = this.bout()?.events ?? [];
    return [...events].reverse().slice(0, 5);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('boutId');
    const tid = this.route.snapshot.paramMap.get('id');
    this.boutId = id ? +id : 0;
    this.tournamentId = tid ? +tid : 0;
    this.loadBout();
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  loadBout(): void {
    this.boutService.getBoutDetails(this.boutId).subscribe({
      next: (b) => {
        this.bout.set(b);
        this.localElapsed.set(b.elapsedSeconds);
        this.loading.set(false);
        if (b.status === 'IN_PROGRESS') {
          this.timerRunning.set(true);
          this.startLocalTimer();
        }
      },
      error: () => this.loading.set(false)
    });
  }

  startBout(): void {
    this.boutService.startBout(this.boutId).subscribe({
      next: (b) => {
        this.bout.set(b);
        this.timerRunning.set(true);
        this.startLocalTimer();
      }
    });
  }

  toggleTimer(): void {
    if (this.timerRunning()) {
      this.timerRunning.set(false);
      this.clearTimers();
    } else {
      this.timerRunning.set(true);
      this.startLocalTimer();
    }
  }

  recordEvent(side: EventSide, eventType: EventType): void {
    if (this.recording()) return;
    this.recording.set(true);
    const req: BoutEventRequest = { side, eventType };
    this.boutService.recordEvent(this.boutId, req).subscribe({
      next: (b) => {
        this.bout.set(b);
        this.recording.set(false);
        if (b.status === 'FINISHED') {
          this.clearTimers();
          this.timerRunning.set(false);
        }
      },
      error: () => this.recording.set(false)
    });
  }

  finishBout(): void {
    const b = this.bout();
    if (!b) return;
    if (b.scoreLeft === b.scoreRight && !b.priority) {
      alert('No se puede finalizar con puntaje empatado. Debe sortear la prioridad primero.');
      return;
    }
    if (!confirm('¿Finalizar el combate? Se declarará al ganador según el puntaje actual.')) return;
    this.boutService.finishBout(this.boutId).subscribe({
      next: (updated) => {
        this.bout.set(updated);
        this.clearTimers();
        this.timerRunning.set(false);
      }
    });
  }

  summonAthletes(): void {
    const b = this.bout();
    if (!b) return;
    if (!confirm('¿Convocar a los atletas? Recibirán una notificación de que su combate comienza en 5 minutos.')) return;
    this.summoning.set(true);
    this.notificationService.notifyUpcomingBout(this.boutId, {
      minutesAhead: 5,
      piste: b.piste ?? undefined
    }).subscribe({
      next: () => {
        this.summoning.set(false);
        alert('Atletas convocados: recibirán la notificación en su panel.');
      },
      error: () => {
        this.summoning.set(false);
        alert('No se pudo enviar la convocatoria. Intente nuevamente.');
      }
    });
  }

  drawPriority(): void {
    const side = Math.random() < 0.5 ? 'LEFT' : 'RIGHT' as const;
    this.recording.set(true);
    this.boutService.assignPriority(this.boutId, side).subscribe({
      next: (updated) => {
        this.bout.set(updated);
        this.recording.set(false);
        const name = side === 'LEFT'
          ? `${updated.athleteLeft.firstName} ${updated.athleteLeft.lastName}`
          : `${updated.athleteRight!.firstName} ${updated.athleteRight!.lastName}`;
        alert(`Prioridad asignada a: ${name}. Se otorga un minuto extra de asalto.`);
      },
      error: () => this.recording.set(false)
    });
  }

  isLeading(side: 'LEFT' | 'RIGHT'): boolean {
    const b = this.bout();
    if (!b) return false;
    if (side === 'LEFT') return b.scoreLeft > b.scoreRight;
    return b.scoreRight > b.scoreLeft;
  }

  winnerName(): string {
    const b = this.bout();
    if (!b || !b.winnerId) return '';
    if (b.winnerId === b.athleteLeft.id) {
      return `${b.athleteLeft.firstName} ${b.athleteLeft.lastName}`;
    }
    return `${b.athleteRight!.firstName} ${b.athleteRight!.lastName}`;
  }

  eventTypeLabel(type: EventType): string {
    const map: Record<EventType, string> = {
      TOUCHE: 'Touché', PENALTY: 'Penalidad', CARD: 'Tarjeta'
    };
    return map[type] ?? type;
  }

  timerColorClass(): string {
    const s = this.localElapsed();
    const max = 180; // 3 min
    if (s >= max) return 'text-red-600';
    if (s >= max * 0.75) return 'text-amber-500';
    return 'text-slate-700';
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

  goBack(): void {
    const b = this.bout();
    if (b && b.pouleId) {
      this.router.navigate(['/bout', this.tournamentId, 'poules', b.pouleId]);
    } else {
      this.router.navigate(['/bout', this.tournamentId, 'poules']);
    }
  }

  private startLocalTimer(): void {
    this.clearTimers();
    this.timerInterval = setInterval(() => {
      this.localElapsed.update(s => s + 1);
    }, 1000);

    // Sync elapsed time to server every 10 seconds
    this.syncInterval = setInterval(() => {
      if (this.timerRunning()) {
        this.boutService.updateElapsedTime(this.boutId, {
          elapsedSeconds: this.localElapsed()
        }).subscribe();
      }
    }, 10000);
  }

  private clearTimers(): void {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    if (this.syncInterval) { clearInterval(this.syncInterval); this.syncInterval = null; }
  }
}

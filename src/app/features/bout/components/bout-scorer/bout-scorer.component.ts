import {
  Component, OnInit, OnDestroy, inject, signal, computed, effect, untracked
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
    <div class="min-h-screen bg-touche-navy flex flex-col">

      <!-- Top bar -->
      <div class="bg-black/30 px-4 py-3 flex items-center justify-between">
        <button (click)="goBack()" class="text-touche-celeste hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="text-center">
          <p class="text-white font-bold text-sm">{{ bout()?.tournamentName }}</p>
          <p class="text-white/50 text-xs">{{ formatLabel() }} · Período {{ bout()?.currentPeriod }}/{{ bout()?.maxPeriods }}</p>
          @if (bout()?.piste) {
            <p class="text-touche-celeste text-xs font-semibold mt-0.5">📍 {{ bout()?.piste }}</p>
          }
        </div>
        <div class="w-8"></div>
      </div>

      @if (loading()) {
        <div class="flex-1 flex items-center justify-center">
          <div class="animate-spin rounded-full h-12 w-12 border-4 border-touche-celeste border-t-transparent"></div>
        </div>
      }

      @if (!loading() && bout()) {
        <div class="flex-1 flex flex-col p-4 gap-4">

          <!-- Scoreboard -->
          <div class="grid grid-cols-3 gap-3 bg-black/20 rounded-2xl p-4">
            <!-- Left athlete -->
            <div class="flex flex-col items-center">
              <div class="w-10 h-10 rounded-full bg-red-500/30 flex items-center justify-center mb-2">
                <span class="text-red-400 font-bold text-sm">
                  {{ bout()!.athleteLeft.firstName.charAt(0) }}
                </span>
              </div>
              <p class="text-white font-semibold text-center text-sm leading-tight">
                {{ bout()!.athleteLeft.firstName }}<br>{{ bout()!.athleteLeft.lastName }}
              </p>
              <p class="text-white/40 text-xs mt-0.5">{{ bout()!.athleteLeft.club ?? '' }}</p>
            </div>

            <!-- Scores + Timer -->
            <div class="flex flex-col items-center justify-center gap-2">
              <div class="flex items-center gap-3">
                <span class="text-5xl md:text-7xl font-black text-white" [class.text-touche-gold]="isLeading('LEFT')">
                  {{ bout()!.scoreLeft }}
                </span>
                <span class="text-2xl text-white/30">:</span>
                <span class="text-5xl md:text-7xl font-black text-white" [class.text-touche-gold]="isLeading('RIGHT')">
                  {{ bout()!.scoreRight }}
                </span>
              </div>
              <!-- Timer -->
              <div class="bg-black/30 rounded-xl px-5 py-2 text-center">
                <span class="text-2xl font-mono font-bold" [class]="timerColor()">
                  {{ formattedTime() }}
                </span>
              </div>
              <!-- Target -->
              <p class="text-white/30 text-xs">Meta: {{ bout()!.touchesTarget }} toques</p>
            </div>

            <!-- Right athlete -->
            <div class="flex flex-col items-center">
              <div class="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center mb-2">
                <span class="text-green-400 font-bold text-sm">
                  {{ bout()!.athleteRight?.firstName?.charAt(0) ?? '' }}
                </span>
              </div>
              <p class="text-white font-semibold text-center text-sm leading-tight">
                {{ bout()!.athleteRight?.firstName ?? '' }}<br>{{ bout()!.athleteRight?.lastName ?? '' }}
              </p>
              <p class="text-white/40 text-xs mt-0.5">{{ bout()!.athleteRight?.club ?? '' }}</p>
            </div>
          </div>

          <!-- Winner banner -->
          @if (bout()!.status === 'FINISHED') {
            <div class="bg-touche-gold/20 border border-touche-gold/50 rounded-2xl p-5 text-center">
              <p class="text-touche-gold font-bold text-lg">🏆 Combate Finalizado</p>
              @if (bout()!.winnerId) {
                <p class="text-white mt-1">
                  Ganador: <strong>{{ winnerName() }}</strong>
                  @if (bout()!.priority) {
                    <span class="text-white/50 text-sm ml-2">(por prioridad)</span>
                  }
                </p>
              }
            </div>
          }

          <!-- Controls (only if active) -->
          @if (bout()!.status !== 'FINISHED') {
            <div class="grid grid-cols-2 gap-3">

              <!-- Left fencer controls -->
              <div class="space-y-2">
                <p class="text-red-400 text-xs font-bold uppercase tracking-wider text-center">
                  {{ bout()!.athleteLeft.firstName }}
                </p>
                <button
                  id="btn-touche-left"
                  (click)="recordEvent('LEFT', 'TOUCHE')"
                  [disabled]="recording() || bout()!.status === 'PENDING'"
                  class="w-full py-5 rounded-2xl bg-red-500/20 hover:bg-red-500/30 active:scale-95 text-red-400 font-bold text-xl transition-all disabled:opacity-30 border border-red-500/30"
                >
                  Touché
                </button>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    id="btn-penalty-left"
                    (click)="recordEvent('LEFT', 'PENALTY')"
                    [disabled]="recording() || bout()!.status === 'PENDING'"
                    class="py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 active:scale-95 text-orange-400 text-sm font-medium transition-all disabled:opacity-30"
                  >
                    Penalidad
                  </button>
                  <button
                    id="btn-card-left"
                    (click)="recordEvent('LEFT', 'CARD')"
                    [disabled]="recording() || bout()!.status === 'PENDING'"
                    class="py-2.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 active:scale-95 text-yellow-400 text-sm font-medium transition-all disabled:opacity-30"
                  >
                    Tarjeta
                  </button>
                </div>
              </div>

              <!-- Right fencer controls -->
              <div class="space-y-2">
                <p class="text-green-400 text-xs font-bold uppercase tracking-wider text-center">
                  {{ bout()!.athleteRight?.firstName ?? '' }}
                </p>
                <button
                  id="btn-touche-right"
                  (click)="recordEvent('RIGHT', 'TOUCHE')"
                  [disabled]="recording() || bout()!.status === 'PENDING'"
                  class="w-full py-5 rounded-2xl bg-green-500/20 hover:bg-green-500/30 active:scale-95 text-green-400 font-bold text-xl transition-all disabled:opacity-30 border border-green-500/30"
                >
                  Touché
                </button>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    id="btn-penalty-right"
                    (click)="recordEvent('RIGHT', 'PENALTY')"
                    [disabled]="recording() || bout()!.status === 'PENDING'"
                    class="py-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 active:scale-95 text-orange-400 text-sm font-medium transition-all disabled:opacity-30"
                  >
                    Penalidad
                  </button>
                  <button
                    id="btn-card-right"
                    (click)="recordEvent('RIGHT', 'CARD')"
                    [disabled]="recording() || bout()!.status === 'PENDING'"
                    class="py-2.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 active:scale-95 text-yellow-400 text-sm font-medium transition-all disabled:opacity-30"
                  >
                    Tarjeta
                  </button>
                </div>
              </div>
            </div>

            <!-- Priority banner (when scores are tied) -->
            @if (bout()!.status === 'IN_PROGRESS' && bout()!.scoreLeft === bout()!.scoreRight && !bout()!.priority) {
              <div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center">
                <p class="text-amber-400 font-bold text-sm mb-3">⚠️ Puntaje empatado — Sortear prioridad para poder finalizar</p>
                <button
                  id="btn-draw-priority"
                  (click)="drawPriority()"
                  [disabled]="recording()"
                  class="px-6 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold transition-all active:scale-95"
                >
                  🎲 Sortear Prioridad
                </button>
              </div>
            }

            @if (bout()!.priority) {
              <div class="bg-touche-celeste/10 border border-touche-celeste/30 rounded-2xl p-3 text-center">
                <p class="text-touche-celeste text-sm font-medium">
                  ⭐ Prioridad:
                  <strong [class]="bout()!.priority === 'LEFT' ? 'text-red-400' : 'text-green-400'">
                    {{ bout()!.priority === 'LEFT' ? bout()!.athleteLeft.firstName : (bout()!.athleteRight?.firstName ?? '') }}
                    {{ bout()!.priority === 'LEFT' ? bout()!.athleteLeft.lastName : (bout()!.athleteRight?.lastName ?? '') }}
                  </strong>
                </p>
              </div>
            }

            <!-- Start / Timer / Finish buttons -->
            <div class="flex gap-3 mt-auto">
              @if (bout()!.status === 'PENDING') {
                <button
                  id="btn-notify-upcoming"
                  (click)="summonAthletes()"
                  [disabled]="summoning()"
                  class="py-4 px-5 rounded-2xl bg-touche-gold/20 hover:bg-touche-gold/30 text-touche-gold font-bold text-lg transition-all border border-touche-gold/30 disabled:opacity-40"
                  title="Notificar a los atletas que su combate comienza en 5 minutos"
                >
                  📣
                </button>
                <button
                  id="btn-start"
                  (click)="startBout()"
                  class="flex-1 py-4 rounded-2xl bg-touche-celeste hover:bg-blue-400 text-touche-navy font-bold text-lg transition-all"
                >
                  ▶ Iniciar Combate
                </button>
              }
              @if (bout()!.status === 'IN_PROGRESS') {
                <button
                  id="btn-timer-toggle"
                  (click)="toggleTimer()"
                  class="py-4 px-6 rounded-2xl font-bold text-lg transition-all"
                  [class]="timerRunning() ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'"
                >
                  {{ timerRunning() ? '⏸' : '▶' }}
                </button>
                <button
                  id="btn-finish"
                  (click)="finishBout()"
                  class="flex-1 py-4 rounded-2xl bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-lg transition-all border border-red-500/30"
                >
                  ⏹ Finalizar
                </button>
              }
            </div>
          }

          <!-- Event log (last 5) -->
          @if (bout()!.events.length > 0) {
            <div class="bg-black/20 rounded-2xl p-4">
              <h4 class="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">Últimos eventos</h4>
              <div class="space-y-1.5">
                @for (event of lastEvents(); track event.id) {
                  <div class="flex items-center justify-between text-sm">
                    <span [class]="event.side === 'LEFT' ? 'text-red-400' : 'text-green-400'" class="font-medium">
                      {{ event.side === 'LEFT' ? bout()!.athleteLeft.firstName : (bout()!.athleteRight?.firstName ?? '') }}
                    </span>
                    <span class="text-white/60">
                      {{ eventTypeLabel(event.eventType) }}
                      @if (event.scoreDelta > 0) {
                        <span class="text-touche-gold ml-1">+{{ event.scoreDelta }}</span>
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

  readonly timerColor = computed(() => {
    const s = this.localElapsed();
    const max = (this.bout()?.format === 'POULE') ? 180 : 180; // 3 min per period
    if (s >= max) return 'text-red-400';
    if (s >= max * 0.75) return 'text-yellow-400';
    return 'text-touche-celeste';
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
    // If scores are tied and no priority, warn the referee
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

  goBack(): void {
    this.router.navigate(['/bout', this.tournamentId, 'bouts']);
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

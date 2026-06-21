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
  styles: [`
    .score-btn { transition: transform 0.1s, opacity 0.15s; }
    .score-btn:active { transform: scale(0.92); }
    .card-pulse { animation: card-pop 0.25s ease-out; }
    @keyframes card-pop { 0%{transform:scale(1)} 50%{transform:scale(1.3)} 100%{transform:scale(1)} }
  `],
  template: `
    <div class="h-full flex flex-col bg-white overflow-hidden select-none">

      <!-- ── Header ─────────────────────────────────────────────────── -->
      <div class="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 flex-shrink-0">
        <button (click)="goBack()" class="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div class="text-center min-w-0 flex-1 px-2">
          <p class="text-slate-700 font-bold text-sm truncate">{{ bout()?.tournamentName }}</p>
          <p class="text-slate-400 text-[10px] font-semibold">
            {{ formatLabel() }}
            @if (bout()?.piste) { &middot; Pista {{ bout()?.piste }} }
          </p>
        </div>
        <!-- Status pill -->
        <div class="flex-shrink-0">
          @if (bout()?.status === 'IN_PROGRESS') {
            <span class="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">EN CURSO</span>
          }
          @if (bout()?.status === 'FINISHED') {
            <span class="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">FINALIZADO</span>
          }
          @if (bout()?.status === 'PENDING') {
            <span class="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200">PENDIENTE</span>
          }
        </div>
      </div>

      <!-- ── Loading ─────────────────────────────────────────────────── -->
      @if (loading()) {
        <div class="flex-grow flex items-center justify-center">
          <div class="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-slate-500"></div>
        </div>
      }

      @if (!loading() && bout()) {
        <div class="flex-grow flex flex-col overflow-hidden">

          <!-- ── Names row ───────────────────────────────────────────── -->
          <div class="flex items-center justify-between px-5 pt-3 pb-0 flex-shrink-0">
            <div class="flex-1 min-w-0">
              <p class="text-red-600 font-bold text-xs truncate">
                {{ bout()!.athleteLeft.firstName }} {{ bout()!.athleteLeft.lastName }}
              </p>
              @if (bout()!.athleteLeft.club) {
                <p class="text-slate-500 text-[9px] font-mono truncate">{{ bout()!.athleteLeft.club }}</p>
              }
            </div>
            <div class="flex-shrink-0 w-16 text-center">
              <p class="text-slate-400 text-[10px] font-bold uppercase tracking-wider">vs</p>
            </div>
            <div class="flex-1 min-w-0 text-right">
              <p class="text-emerald-600 font-bold text-xs truncate">
                {{ bout()!.athleteRight?.firstName ?? 'BYE' }} {{ bout()!.athleteRight?.lastName ?? '' }}
              </p>
              @if (bout()!.athleteRight?.club) {
                <p class="text-slate-500 text-[9px] font-mono truncate">{{ bout()!.athleteRight?.club }}</p>
              }
            </div>
          </div>

          <!-- ── Scoreboard ──────────────────────────────────────────── -->
          <div class="flex items-center justify-center gap-3 px-4 pt-2 pb-2 flex-shrink-0">

            <!-- Left score column -->
            <div class="flex flex-col items-center gap-1">
              <button
                id="btn-touche-left"
                (click)="recordEvent('LEFT', 'TOUCHE')"
                [disabled]="disabled()"
                class="score-btn w-14 h-9 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 flex items-center justify-center text-red-500 text-lg font-black disabled:opacity-30"
              >↑</button>
              <div class="w-20 h-20 rounded-2xl bg-red-50 border-2 border-red-200 flex items-center justify-center">
                <span class="font-black text-5xl text-red-500 leading-none">{{ bout()!.scoreLeft }}</span>
              </div>
              <button
                id="btn-correction-left"
                (click)="recordEvent('LEFT', 'SCORE_CORRECTION')"
                [disabled]="disabled() || bout()!.scoreLeft === 0"
                class="score-btn w-14 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-lg font-black disabled:opacity-30"
              >↓</button>
            </div>

            <!-- Center: Double + timer -->
            <div class="flex flex-col items-center gap-2 flex-1">
              <!-- Double touch and manual priority -->
              <div class="flex items-center gap-2">
                <button
                  id="btn-double"
                  (click)="recordDoubleTouch()"
                  [disabled]="disabled()"
                  class="score-btn px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-bold transition-colors disabled:opacity-30"
                >Double</button>
                <button
                  id="btn-manual-priority"
                  (click)="drawPriority()"
                  [disabled]="disabled() || bout()!.priority"
                  class="score-btn p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-xs font-bold transition-colors disabled:opacity-30"
                  title="Sortear Prioridad"
                >🎲</button>
              </div>

              <!-- Timer -->
              <div class="rounded-2xl px-6 py-3 text-center" [class]="timerBgClass()">
                <span class="text-4xl font-mono font-black tracking-tight" [class]="timerTextClass()">
                  {{ formattedTime() }}
                </span>
              </div>

              <p class="text-slate-500 text-[9px] font-bold uppercase tracking-wider">
                Meta: {{ bout()!.touchesTarget }} toques
              </p>
            </div>

            <!-- Right score column -->
            <div class="flex flex-col items-center gap-1">
              <button
                id="btn-touche-right"
                (click)="recordEvent('RIGHT', 'TOUCHE')"
                [disabled]="disabled()"
                class="score-btn w-14 h-9 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-500 text-lg font-black disabled:opacity-30"
              >↑</button>
              <div class="w-20 h-20 rounded-2xl bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
                <span class="font-black text-5xl text-emerald-500 leading-none">{{ bout()!.scoreRight }}</span>
              </div>
              <button
                id="btn-correction-right"
                (click)="recordEvent('RIGHT', 'SCORE_CORRECTION')"
                [disabled]="disabled() || bout()!.scoreRight === 0"
                class="score-btn w-14 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-lg font-black disabled:opacity-30"
              >↓</button>
            </div>
          </div>

          <!-- ── Cards strip ─────────────────────────────────────────── -->
          <div class="flex items-center justify-between px-6 py-1.5 flex-shrink-0">
            <!-- Left cards -->
            <div class="flex items-center gap-1.5">
              <div class="flex flex-col items-center gap-0.5">
                <div class="w-6 h-4 rounded-sm flex items-center justify-center text-[9px] font-black"
                  [class]="yellowCardsLeft() > 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-100 text-slate-300 border border-slate-200'">
                  {{ yellowCardsLeft() }}
                </div>
              </div>
              <div class="flex flex-col items-center gap-0.5">
                <div class="w-6 h-4 rounded-sm flex items-center justify-center text-[9px] font-black"
                  [class]="redCardsLeft() > 0 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-300 border border-slate-200'">
                  {{ redCardsLeft() }}
                </div>
              </div>
            </div>

            <!-- Period indicator -->
            <div class="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200">
              <p class="text-slate-500 font-bold text-[10px]">P.{{ bout()!.currentPeriod }}/{{ bout()!.maxPeriods }}</p>
            </div>

            <!-- Right cards -->
            <div class="flex items-center gap-1.5">
              <div class="flex flex-col items-center gap-0.5">
                <div class="w-6 h-4 rounded-sm flex items-center justify-center text-[9px] font-black"
                  [class]="redCardsRight() > 0 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-300 border border-slate-200'">
                  {{ redCardsRight() }}
                </div>
              </div>
              <div class="flex flex-col items-center gap-0.5">
                <div class="w-6 h-4 rounded-sm flex items-center justify-center text-[9px] font-black"
                  [class]="yellowCardsRight() > 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-slate-100 text-slate-300 border border-slate-200'">
                  {{ yellowCardsRight() }}
                </div>
              </div>
            </div>
          </div>

          <!-- ── Main action area (pause/resume + card buttons) ─────── -->
          @if (bout()!.status !== 'FINISHED') {
            <div class="flex-1 flex flex-col justify-between px-4 pb-4 gap-3">

              <!-- Pause / Resume / Start — the big central button -->
              <div class="flex gap-3">
                @if (bout()!.status === 'PENDING') {
                  <button
                    id="btn-summon"
                    (click)="summonAthletes()"
                    [disabled]="summoning()"
                    class="score-btn py-3 px-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-500 font-bold text-sm disabled:opacity-40"
                    title="Convocar atletas (5 min)"
                  >📣</button>
                  <button
                    id="btn-start"
                    (click)="startBout()"
                    class="score-btn flex-1 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black text-base shadow-md"
                  >Iniciar Combate</button>
                }

                @if (bout()!.status === 'IN_PROGRESS') {
                  <button
                    id="btn-timer"
                    (click)="toggleTimer()"
                    class="score-btn flex-1 py-5 rounded-2xl font-black text-xl shadow-md transition-colors"
                    [class]="timerRunning()
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'"
                  >
                    {{ timerRunning() ? '⏸ Pausar' : '▶ Reanudar' }}
                  </button>
                }
              </div>

              <!-- Card buttons row -->
              @if (bout()!.status === 'IN_PROGRESS') {
                <div class="grid grid-cols-4 gap-2">
                  <button id="btn-yellow-left" (click)="recordEvent('LEFT', 'YELLOW_CARD')" [disabled]="disabled()"
                    class="score-btn py-2.5 rounded-xl bg-yellow-50 hover:bg-yellow-100 border border-yellow-300 text-yellow-700 text-[11px] font-bold disabled:opacity-30">
                    🟡 Amarilla
                  </button>
                  <button id="btn-red-left" (click)="recordEvent('LEFT', 'RED_CARD')" [disabled]="disabled()"
                    class="score-btn py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 text-[11px] font-bold disabled:opacity-30">
                    🔴 Roja
                  </button>
                  <button id="btn-red-right" (click)="recordEvent('RIGHT', 'RED_CARD')" [disabled]="disabled()"
                    class="score-btn py-2.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 text-[11px] font-bold disabled:opacity-30">
                    🔴 Roja
                  </button>
                  <button id="btn-yellow-right" (click)="recordEvent('RIGHT', 'YELLOW_CARD')" [disabled]="disabled()"
                    class="score-btn py-2.5 rounded-xl bg-yellow-50 hover:bg-yellow-100 border border-yellow-300 text-yellow-700 text-[11px] font-bold disabled:opacity-30">
                    🟡 Amarilla
                  </button>
                </div>

                <!-- Priority banner (tied scores) -->
                @if (bout()!.scoreLeft === bout()!.scoreRight && timeEnded() && !bout()!.priority) {
                  <div class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 flex items-center justify-between">
                    <p class="text-amber-700 font-bold text-xs">⚠️ Empate — sortear prioridad</p>
                    <button id="btn-priority" (click)="drawPriority()" [disabled]="recording()"
                      class="score-btn px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs disabled:opacity-40">
                      🎲 Sortear
                    </button>
                  </div>
                }

                @if (bout()!.priority) {
                  <div class="bg-sky-50 border border-sky-200 rounded-xl px-4 py-2 text-center">
                    <p class="text-sky-700 font-semibold text-xs">
                      ⭐ Prioridad:
                      <strong [class]="bout()!.priority === 'LEFT' ? 'text-red-500' : 'text-emerald-600'">
                        {{ priorityName() }}
                      </strong>
                    </p>
                  </div>
                }

                <!-- Finish -->
                <button id="btn-finish" (click)="finishBout()"
                  [class]="readyToFinish()
                    ? 'score-btn w-full py-3 rounded-2xl bg-touche-navy hover:bg-[#14143A] text-white font-bold text-sm shadow-md'
                    : 'score-btn w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 font-bold text-sm'">
                  Finalizar Combate
                </button>
              }
            </div>
          }

          <!-- ── Winner banner ───────────────────────────────────────── -->
          @if (bout()!.status === 'FINISHED') {
            <div class="flex-1 flex flex-col items-center justify-center px-6 gap-4">
              <div class="w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-300 flex items-center justify-center text-3xl">🏆</div>
              <div class="text-center">
                <p class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Combate Finalizado</p>
                <p class="text-slate-800 font-black text-xl">{{ winnerName() }}</p>
                @if (bout()!.priority) {
                  <p class="text-slate-400 text-xs mt-1">por prioridad</p>
                }
              </div>
              <div class="bg-slate-50 border border-slate-200 rounded-2xl px-8 py-3 flex items-center gap-6">
                <div class="text-center">
                  <p class="text-red-400 text-[10px] font-bold truncate max-w-[80px]">{{ bout()!.athleteLeft.lastName }}</p>
                  <p class="text-red-500 font-black text-3xl">{{ bout()!.scoreLeft }}</p>
                </div>
                <p class="text-slate-300 font-bold text-xl">–</p>
                <div class="text-center">
                  <p class="text-emerald-400 text-[10px] font-bold truncate max-w-[80px]">{{ bout()!.athleteRight?.lastName ?? 'BYE' }}</p>
                  <p class="text-emerald-500 font-black text-3xl">{{ bout()!.scoreRight }}</p>
                </div>
              </div>

              <!-- Recent events log (last 5) -->
              @if (lastEvents().length > 0) {
                <div class="w-full bg-white border border-slate-100 rounded-2xl p-4">
                  <p class="text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-2">Últimos eventos</p>
                  @for (ev of lastEvents(); track ev.id) {
                    <div class="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                      <span class="text-xs font-bold" [class]="ev.side === 'LEFT' ? 'text-red-400' : 'text-emerald-500'">
                        {{ ev.side === 'LEFT' ? bout()!.athleteLeft.lastName : (bout()!.athleteRight?.lastName ?? '') }}
                      </span>
                      <span class="text-xs text-slate-500 font-semibold">{{ eventLabel(ev.eventType) }}</span>
                    </div>
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
  readonly localElapsed = signal(0);

  /** True when buttons should be disabled */
  readonly disabled = computed(() =>
    this.recording() || this.bout()?.status === 'PENDING' || this.bout()?.status === 'FINISHED'
  );

  readonly timeEnded = computed(() => this.localElapsed() >= 180);

  readonly readyToFinish = computed(() => {
    const b = this.bout();
    if (!b) return false;
    const target = b.format === 'POULE' ? 5 : 15;
    return b.scoreLeft >= target || b.scoreRight >= target || this.timeEnded();
  });

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

  readonly lastEvents = computed(() =>
    [...(this.bout()?.events ?? [])].reverse().slice(0, 5)
  );

  // ── Card counters (derived from event log) ─────────────────────────────
  readonly yellowCardsLeft = computed(() =>
    this.bout()?.events.filter(e => e.eventType === 'YELLOW_CARD' && e.side === 'LEFT').length ?? 0
  );
  readonly redCardsLeft = computed(() =>
    this.bout()?.events.filter(e => e.eventType === 'RED_CARD' && e.side === 'LEFT').length ?? 0
  );
  readonly yellowCardsRight = computed(() =>
    this.bout()?.events.filter(e => e.eventType === 'YELLOW_CARD' && e.side === 'RIGHT').length ?? 0
  );
  readonly redCardsRight = computed(() =>
    this.bout()?.events.filter(e => e.eventType === 'RED_CARD' && e.side === 'RIGHT').length ?? 0
  );

  // ── Timer styling ──────────────────────────────────────────────────────
  timerBgClass(): string {
    const s = this.localElapsed();
    const max = this.bout()?.format === 'POULE' ? 180 : 180;
    if (s >= max) return 'bg-red-50 border border-red-200';
    if (s >= max * 0.75) return 'bg-amber-50 border border-amber-200';
    return 'bg-slate-50 border border-slate-200';
  }

  timerTextClass(): string {
    const s = this.localElapsed();
    const max = 180;
    if (s >= max) return 'text-red-600';
    if (s >= max * 0.75) return 'text-amber-500';
    return 'text-slate-700';
  }

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
    if (this.recording() || this.bout()?.status !== 'IN_PROGRESS') return;
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

  /** Record a simultaneous double touch (+1 for each fencer) */
  recordDoubleTouch(): void {
    if (this.recording() || this.bout()?.status !== 'IN_PROGRESS') return;
    this.recording.set(true);
    this.boutService.recordEvent(this.boutId, { side: 'LEFT', eventType: 'TOUCHE' }).subscribe({
      next: () => {
        this.boutService.recordEvent(this.boutId, { side: 'RIGHT', eventType: 'TOUCHE' }).subscribe({
          next: (b) => {
            this.bout.set(b);
            this.recording.set(false);
            if (b.status === 'FINISHED') { this.clearTimers(); this.timerRunning.set(false); }
          },
          error: () => this.recording.set(false)
        });
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
    if (!confirm('¿Convocar a los atletas? Recibirán una notificación.')) return;
    this.summoning.set(true);
    this.notificationService.notifyUpcomingBout(this.boutId, {
      minutesAhead: 5,
      piste: b.piste ?? undefined
    }).subscribe({
      next: () => { this.summoning.set(false); alert('Atletas convocados correctamente.'); },
      error: () => { this.summoning.set(false); alert('Error al enviar la convocatoria.'); }
    });
  }

  drawPriority(): void {
    const side = (Math.random() < 0.5 ? 'LEFT' : 'RIGHT') as EventSide;
    this.recording.set(true);
    this.boutService.assignPriority(this.boutId, side).subscribe({
      next: (updated) => {
        this.bout.set(updated);
        this.recording.set(false);
        const name = side === 'LEFT'
          ? `${updated.athleteLeft.firstName} ${updated.athleteLeft.lastName}`
          : `${updated.athleteRight!.firstName} ${updated.athleteRight!.lastName}`;
        alert(`Prioridad asignada a: ${name}`);
      },
      error: () => this.recording.set(false)
    });
  }

  winnerName(): string {
    const b = this.bout();
    if (!b || !b.winnerId) return '';
    return b.winnerId === b.athleteLeft.id
      ? `${b.athleteLeft.firstName} ${b.athleteLeft.lastName}`
      : `${b.athleteRight!.firstName} ${b.athleteRight!.lastName}`;
  }

  priorityName(): string {
    const b = this.bout();
    if (!b?.priority) return '';
    return b.priority === 'LEFT'
      ? `${b.athleteLeft.firstName} ${b.athleteLeft.lastName}`
      : `${b.athleteRight?.firstName} ${b.athleteRight?.lastName}`;
  }

  eventLabel(type: EventType): string {
    const map: Record<EventType, string> = {
      TOUCHE: 'Touché', YELLOW_CARD: '🟡 Amarilla', RED_CARD: '🔴 Roja', SCORE_CORRECTION: '↩ Corrección'
    };
    return map[type] ?? type;
  }

  goBack(): void {
    const b = this.bout();
    if (b?.pouleId) {
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

import {
  Component, OnInit, OnDestroy, inject, signal, computed, HostListener
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BoutService } from '../../services/bout.service';
import { NotificationService } from '../../../../shared/services/notification.service';
import { AlertService } from '../../../../shared/services/alert.service';
import {
  BoutResponse, BoutEventRequest, EventSide, EventType
} from '../../../../core/models/bout.models';
import { ELIMINATION_ROUND_LABELS } from '../../../../shared/utils/label.maps';

/** Duration of a single bout period in seconds */
const BOUT_DURATION = 180;

/** Minimum hold duration (ms) to trigger a REMOVE / CORRECTION action */
const HOLD_MS = 400;

@Component({
  selector: 'app-bout-scorer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './bout-scorer.component.css',
  templateUrl: './bout-scorer.component.html'
})
export class BoutScorerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly boutService = inject(BoutService);
  private readonly notificationService = inject(NotificationService);
  private readonly alertService = inject(AlertService);

  private boutId = 0;
  private tournamentId = 0;

  // Timers
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;
  private hapticInterval: ReturnType<typeof setInterval> | null = null;
  private holdTimer: ReturnType<typeof setTimeout> | null = null;
  private holdTriggered = false;

  // Audio context for beep
  private audioCtx: AudioContext | null = null;

  // ── State signals ────────────────────────────────────────────────────────────
  readonly bout       = signal<BoutResponse | null>(null);
  readonly loading    = signal(true);
  readonly recording  = signal(false);
  readonly timerRunning = signal(false);
  readonly summoning  = signal(false);
  readonly inRestPeriod = signal(false);

  /** Countdown: seconds remaining in this period */
  readonly localRemaining = signal(BOUT_DURATION);

  /** Which score button is being held (for visual feedback) */
  readonly holdingSide = signal<EventSide | null>(null);

  /** Card flash color (3-second full-screen overlay) */
  readonly cardFlashColor = signal<'yellow' | 'red' | null>(null);

  /** Set-time modal */
  readonly showMenu = signal(false);
  readonly showSetTime = signal(false);
  setTimeInput = '';

  // ── Computed ─────────────────────────────────────────────────────────────────
  readonly disabledAll = computed(() =>
    this.recording() || this.bout()?.status === 'PENDING' || this.bout()?.status === 'FINISHED'
  );

  readonly timeEnded = computed(() => this.localRemaining() <= 0);

  readonly maxScore = computed(() => this.bout()?.format === 'POULE' ? 5 : 15);

  /** True when this side can still receive a TOUCHE (below the score limit) */
  readonly canScoreLeft  = computed(() =>
    (this.bout()?.scoreLeft  ?? 0) < this.maxScore() && this.bout()?.status === 'IN_PROGRESS'
  );
  readonly canScoreRight = computed(() =>
    (this.bout()?.scoreRight ?? 0) < this.maxScore() && this.bout()?.status === 'IN_PROGRESS'
  );

  readonly readyToFinish = computed(() => {
    const b = this.bout();
    if (!b) return false;
    if (b.scoreLeft >= this.maxScore() || b.scoreRight >= this.maxScore()) {
      return true;
    }
    if (this.timeEnded() && !this.inRestPeriod() && b.currentPeriod === b.maxPeriods) {
      return true;
    }
    return false;
  });

  readonly formattedTime = computed(() => {
    const s = Math.max(0, this.localRemaining());
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  });

  /** Label shown in the header subtitle: "Poule N°2", "Final", "Cuartos de final", etc. */
  readonly roundLabel = computed(() => {
    const b = this.bout();
    if (!b) return '';
    if (b.pouleId != null) return `Poule N°${b.pouleNumber ?? ''}`;
    if (b.eliminationRound) return ELIMINATION_ROUND_LABELS[b.eliminationRound] ?? b.eliminationRound;
    return 'Asalto';
  });

  readonly boutEvents = computed(() =>
    [...(this.bout()?.events ?? [])].reverse()
  );

  // Card counters — net of removals so hold-to-remove reflects correctly
  readonly yellowCardsLeft = computed(() => {
    const evs = this.bout()?.events ?? [];
    const added   = evs.filter(e => e.eventType === 'YELLOW_CARD'         && e.side === 'LEFT').length;
    const removed = evs.filter(e => e.eventType === 'YELLOW_CARD_REMOVAL' && e.side === 'LEFT').length;
    return Math.max(0, added - removed);
  });
  readonly redCardsLeft = computed(() => {
    const evs = this.bout()?.events ?? [];
    const added   = evs.filter(e => e.eventType === 'RED_CARD'         && e.side === 'LEFT').length;
    const removed = evs.filter(e => e.eventType === 'RED_CARD_REMOVAL' && e.side === 'LEFT').length;
    return Math.max(0, added - removed);
  });
  readonly yellowCardsRight = computed(() => {
    const evs = this.bout()?.events ?? [];
    const added   = evs.filter(e => e.eventType === 'YELLOW_CARD'         && e.side === 'RIGHT').length;
    const removed = evs.filter(e => e.eventType === 'YELLOW_CARD_REMOVAL' && e.side === 'RIGHT').length;
    return Math.max(0, added - removed);
  });
  readonly redCardsRight = computed(() => {
    const evs = this.bout()?.events ?? [];
    const added   = evs.filter(e => e.eventType === 'RED_CARD'         && e.side === 'RIGHT').length;
    const removed = evs.filter(e => e.eventType === 'RED_CARD_REMOVAL' && e.side === 'RIGHT').length;
    return Math.max(0, added - removed);
  });

  // ── Lifecycle ────────────────────────────────────────────────────────────────
  ngOnInit(): void {
    const id  = this.route.snapshot.paramMap.get('boutId');
    const tid = this.route.snapshot.paramMap.get('id');
    this.boutId      = id  ? +id  : 0;
    this.tournamentId = tid ? +tid : 0;
    this.loadBout();
  }

  ngOnDestroy(): void {
    this.clearAllIntervals();
    this.audioCtx?.close();
  }

  // ── Data loading ─────────────────────────────────────────────────────────────
  loadBout(): void {
    this.boutService.getBoutDetails(this.boutId).subscribe({
      next: (b) => {
        this.bout.set(b);
        this.localRemaining.set(Math.max(0, BOUT_DURATION - b.elapsedSeconds));
        this.loading.set(false);
        if (b.status === 'IN_PROGRESS' && !b.timerPaused) {
          this.timerRunning.set(true);
          this.startLocalTimer();
        }
      },
      error: () => this.loading.set(false)
    });
  }

  // ── Timer control ─────────────────────────────────────────────────────────────
  startBout(): void {
    this.boutService.startBout(this.boutId).subscribe({
      next: (b) => {
        this.bout.set(b);
        this.timerRunning.set(true);
        this.startLocalTimer();
        this.beepAndVibrate();
      }
    });
  }

  toggleTimer(): void {
    if (this.timerRunning()) {
      this.pauseTimer();
    } else {
      this.resumeTimer();
    }
    this.beepAndVibrate();
  }

  private pauseTimer(): void {
    if (!this.timerRunning()) return;
    this.timerRunning.set(false);
    this.clearTimerIntervals();
    // Persist elapsed time + signal paused state to spectators
    this.syncElapsed(true);
  }

  private resumeTimer(): void {
    this.timerRunning.set(true);
    // Signal timer resumed to spectators immediately
    this.syncElapsed(false);
    this.startLocalTimer();
  }

  private startLocalTimer(): void {
    this.clearTimerIntervals();
    // Countdown tick
    this.timerInterval = setInterval(() => {
      if (this.localRemaining() > 0) {
        this.localRemaining.update(s => s - 1);
      } else {
        // Time ended — stop ticking but keep timer "running" state for UX
        this.clearTimerIntervals();
        this.timerRunning.set(false);
        this.beepAndVibrate();
      }
    }, 1000);
    // Haptic every 5s while timer runs — double pulse "brrr brrr"
    this.hapticInterval = setInterval(() => {
      if (this.timerRunning()) navigator.vibrate?.([100, 80, 100]);
    }, 5000);
    // Persist elapsed every 10s
    this.syncInterval = setInterval(() => {
      if (this.timerRunning()) this.syncElapsed();
    }, 10000);
  }

  private syncElapsed(timerPaused = !this.timerRunning()): void {
    if (this.inRestPeriod()) return; // Do not sync rest period time to backend
    const elapsed = BOUT_DURATION - this.localRemaining();
    this.boutService.updateElapsedTime(this.boutId, { elapsedSeconds: elapsed, timerPaused }).subscribe();
  }

  // ── Set time ─────────────────────────────────────────────────────────────────
  openSetTime(): void {
    this.pauseTimer();
    const s = this.localRemaining();
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    this.setTimeInput = `${m}:${sec}`;
    this.showSetTime.set(true);
  }

  closeSetTime(): void {
    this.showSetTime.set(false);
  }

  applySetTime(): void {
    const parts = this.setTimeInput.split(':');
    if (parts.length === 2) {
      const min = parseInt(parts[0], 10);
      const sec = parseInt(parts[1], 10);
      if (!isNaN(min) && !isNaN(sec)) {
        const total = Math.max(0, Math.min(BOUT_DURATION, min * 60 + sec));
        this.localRemaining.set(total);
        this.syncElapsed();
      }
    }
    this.showSetTime.set(false);
  }

  startRest(): void {
    this.inRestPeriod.set(true);
    this.localRemaining.set(60);
    this.timerRunning.set(true);
    this.startLocalTimer();
  }

  resumeNextPeriod(): void {
    const b = this.bout();
    if (!b) return;
    const nextPeriod = b.currentPeriod + 1;
    this.inRestPeriod.set(false);
    this.localRemaining.set(BOUT_DURATION);
    this.recording.set(true);
    this.boutService.updateElapsedTime(this.boutId, {
      elapsedSeconds: 0,
      timerPaused: true,
      currentPeriod: nextPeriod
    }).subscribe({
      next: (updated) => {
        this.bout.set(updated);
        this.recording.set(false);
      },
      error: () => this.recording.set(false)
    });
  }

  // ── Score press & hold ───────────────────────────────────────────────────────
  onScorePointerDown(side: EventSide, event: PointerEvent): void {
    event.preventDefault();
    this.holdTriggered = false;
    this.holdingSide.set(side);
    this.holdTimer = setTimeout(() => {
      this.holdTriggered = true;
      this.holdingSide.set(null);
      // Hold = correct (subtract)
      this.executeAction(side, 'SCORE_CORRECTION');
    }, HOLD_MS);
  }

  onScorePointerUp(side: EventSide): void {
    this.cancelHold();
    if (!this.holdTriggered) {
      // Tap = add touche — only blocked when score limit is reached.
      // Hold (SCORE_CORRECTION) is never blocked so the referee can always subtract.
      const atLimit = side === 'LEFT' ? !this.canScoreLeft() : !this.canScoreRight();
      if (atLimit) return;
      this.executeAction(side, 'TOUCHE');
    }
  }

  // ── Card press & hold ────────────────────────────────────────────────────────
  onCardPointerDown(side: EventSide, cardType: 'YELLOW_CARD' | 'RED_CARD', event: PointerEvent): void {
    event.preventDefault();
    this.holdTriggered = false;
    this.holdTimer = setTimeout(() => {
      this.holdTriggered = true;
      const removeType: EventType = cardType === 'YELLOW_CARD' ? 'YELLOW_CARD_REMOVAL' : 'RED_CARD_REMOVAL';
      this.executeAction(side, removeType);
    }, HOLD_MS);
  }

  onCardPointerUp(side: EventSide, cardType: 'YELLOW_CARD' | 'RED_CARD'): void {
    this.cancelHold();
    if (!this.holdTriggered) {
      // Tap = add card
      this.executeCardAdd(side, cardType);
    }
  }

  cancelHold(): void {
    if (this.holdTimer) { clearTimeout(this.holdTimer); this.holdTimer = null; }
    this.holdingSide.set(null);
  }

  // ── Core action executor ─────────────────────────────────────────────────────
  private executeAction(side: EventSide, eventType: EventType): void {
    if (this.recording() || this.bout()?.status !== 'IN_PROGRESS') return;
    this.pauseTimer();  // every action pauses the timer
    this.recording.set(true);
    const req: BoutEventRequest = { side, eventType };
    this.boutService.recordEvent(this.boutId, req).subscribe({
      next: (b) => { this.bout.set(b); this.recording.set(false); },
      error: () => this.recording.set(false)
    });
  }

  /** Adding a card also triggers the fullscreen flash */
  private executeCardAdd(side: EventSide, cardType: 'YELLOW_CARD' | 'RED_CARD'): void {
    if (this.recording() || this.bout()?.status !== 'IN_PROGRESS') return;
    this.pauseTimer();
    this.recording.set(true);
    const req: BoutEventRequest = { side, eventType: cardType };
    this.boutService.recordEvent(this.boutId, req).subscribe({
      next: (b) => {
        this.bout.set(b);
        this.recording.set(false);
        // Flash full screen with card color for 3s
        this.cardFlashColor.set(cardType === 'YELLOW_CARD' ? 'yellow' : 'red');
        setTimeout(() => this.cardFlashColor.set(null), 3000);
      },
      error: () => this.recording.set(false)
    });
  }

  recordDoubleTouch(): void {
    if (this.recording() || this.bout()?.status !== 'IN_PROGRESS') return;
    this.pauseTimer();
    this.recording.set(true);
    this.boutService.recordEvent(this.boutId, { side: 'LEFT', eventType: 'TOUCHE' }).subscribe({
      next: () => {
        this.boutService.recordEvent(this.boutId, { side: 'RIGHT', eventType: 'TOUCHE' }).subscribe({
          next: (b) => { this.bout.set(b); this.recording.set(false); },
          error: () => this.recording.set(false)
        });
      },
      error: () => this.recording.set(false)
    });
  }

  async finishBout(): Promise<void> {
    const b = this.bout();
    if (!b) return;
    this.pauseTimer();
    if (b.scoreLeft === b.scoreRight && !b.priority) {
      await this.alertService.error('Empate', 'No se puede finalizar con puntaje empatado. Debe sortear la prioridad primero.');
      return;
    }
    const confirmed = await this.alertService.confirm('Finalizar combate', '¿Finalizar el combate? Se declarará al ganador según el puntaje actual.');
    if (!confirmed) return;
    this.boutService.finishBout(this.boutId).subscribe({
      next: (updated) => {
        this.bout.set(updated);
        this.clearAllIntervals();
        this.timerRunning.set(false);
        this.beepAndVibrate();
      }
    });
  }

  async summonAthletes(): Promise<void> {
    const b = this.bout();
    if (!b) return;
    const confirmed = await this.alertService.confirm('Convocar', '¿Convocar a los atletas? Recibirán una notificación.');
    if (!confirmed) return;
    this.summoning.set(true);
    this.notificationService.notifyUpcomingBout(this.boutId, {
      minutesAhead: 5,
      piste: b.piste ?? undefined
    }).subscribe({
      next: () => { this.summoning.set(false); this.alertService.success('Convocatoria', 'Atletas convocados correctamente.'); },
      error: () => { this.summoning.set(false); this.alertService.error('Error', 'Error al enviar la convocatoria.'); }
    });
  }

  drawPriority(): void {
    this.pauseTimer();
    const side = (Math.random() < 0.5 ? 'LEFT' : 'RIGHT') as EventSide;
    this.recording.set(true);
    this.boutService.assignPriority(this.boutId, side).subscribe({
      next: (updated) => {
        this.bout.set(updated);
        this.recording.set(false);

        // When priority is drawn (typically at time-end tie), set remaining time to 1 minute (60 seconds)
        this.localRemaining.set(60);
        this.syncElapsed();

        const name = side === 'LEFT'
          ? `${updated.athleteLeft.firstName} ${updated.athleteLeft.lastName}`
          : `${updated.athleteRight!.firstName} ${updated.athleteRight!.lastName}`;
        this.alertService.info('Prioridad', `Prioridad asignada a: ${name}. Se ha establecido 1 minuto de tiempo.`);
      },
      error: () => this.recording.set(false)
    });
  }

  goBack(): void {
    this.pauseTimer();
    const b = this.bout();
    if (b?.pouleId) {
      this.router.navigate(['/bout', this.tournamentId, 'poules', b.pouleId]);
    } else {
      this.router.navigate(['/bout', this.tournamentId, 'bouts']);
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────
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
      TOUCHE: 'Touché', YELLOW_CARD: '🟡 Amarilla', RED_CARD: '🔴 Roja',
      SCORE_CORRECTION: '↩ Corrección',
      YELLOW_CARD_REMOVAL: '🟡 Quita Amarilla', RED_CARD_REMOVAL: '🔴 Quita Roja'
    };
    return map[type] ?? type;
  }

  // ── Options Menu ─────────────────────────────────────────────────────────────
  toggleMenu(): void {
    this.showMenu.update(v => !v);
  }

  closeMenu(): void {
    this.showMenu.set(false);
  }

  async manualFinishBout(): Promise<void> {
    this.closeMenu();
    await this.finishBout();
  }

  openSetTimeDropdown(): void {
    this.closeMenu();
    this.openSetTime();
  }

  async summonAthletesDropdown(): Promise<void> {
    this.closeMenu();
    await this.summonAthletes();
  }

  // ── Haptic / Audio ───────────────────────────────────────────────────────────
  private beepAndVibrate(): void {
    navigator.vibrate?.([50, 30, 50]);
    try {
      const ctx = this.audioCtx ?? (this.audioCtx = new AudioContext());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch { /* AudioContext not available */ }
  }

  // ── Interval management ──────────────────────────────────────────────────────
  private clearTimerIntervals(): void {
    if (this.timerInterval)  { clearInterval(this.timerInterval);  this.timerInterval = null; }
    if (this.hapticInterval) { clearInterval(this.hapticInterval); this.hapticInterval = null; }
    if (this.syncInterval)   { clearInterval(this.syncInterval);   this.syncInterval = null; }
  }

  private clearAllIntervals(): void {
    this.clearTimerIntervals();
    this.cancelHold();
  }
}

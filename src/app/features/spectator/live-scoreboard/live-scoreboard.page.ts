import { Component, NgZone, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { BoutLiveUpdate } from '../../../core/models/notification.models';
import { BoutResponse, EventType } from '../../../core/models/bout.models';
import { PublicTournamentService } from '../services/public-tournament.service';

/**
 * Public live scoreboard for spectators (no auth required).
 * Subscribes to the bout SSE stream and updates the score and countdown in real time.
 */
@Component({
  selector: 'app-live-scoreboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-scoreboard.page.html',
  styleUrl: './live-scoreboard.page.css'
})
export class LiveScoreboardPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly zone = inject(NgZone);
  private readonly location = inject(Location);
  private readonly publicTournamentService = inject(PublicTournamentService);

  private eventSource: EventSource | null = null;
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  readonly bout = signal<BoutResponse | null>(null);
  readonly loading = signal(true);
  readonly connectionError = signal(false);

  /** Countdown: seconds remaining in this period (normally starts at 3 minutes = 180s) */
  readonly localRemaining = signal(180);

  /** Mirrors the referee's timer state — false when the referee has paused the clock */
  readonly timerRunning = signal(false);

  /** Image load error flags */
  readonly leftPhotoFailed = signal(false);
  readonly rightPhotoFailed = signal(false);

  readonly formattedTime = computed(() => {
    const s = Math.max(0, this.localRemaining());
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  });

  readonly isLive = computed(() => this.bout()?.status === 'IN_PROGRESS');
  readonly isFinished = computed(() => this.bout()?.status === 'FINISHED');

  /** Latest actions in reverse chronological order */
  readonly latestEvents = computed(() => {
    const b = this.bout();
    if (!b || !b.events) return [];
    return [...b.events].sort((a, c) => new Date(c.recordedAt).getTime() - new Date(a.recordedAt).getTime());
  });

  ngOnInit(): void {
    const boutId = +(this.route.snapshot.paramMap.get('boutId') ?? 0);
    this.loadFullDetails(boutId, true);
    this.connectStream(boutId);

    // Local clock: decrements remaining seconds every second while the bout is live AND timer is running
    this.clockInterval = setInterval(() => {
      if (this.isLive() && this.timerRunning() && this.localRemaining() > 0) {
        this.localRemaining.update(s => Math.max(0, s - 1));
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    this.eventSource?.close();
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  private loadFullDetails(boutId: number, setLoader = false): void {
    if (setLoader) {
      this.loading.set(true);
    }
    this.publicTournamentService.getBoutDetails(boutId).subscribe({
      next: (data: BoutResponse) => {
        this.bout.set(data);
        this.localRemaining.set(Math.max(0, 180 - data.elapsedSeconds));
        // Initialize timer running state from the response (only runs if live and not paused)
        if (setLoader) {
          this.timerRunning.set(data.status === 'IN_PROGRESS' && !data.timerPaused);
        }
        this.connectionError.set(false);
        this.loading.set(false);
      },
      error: (err: unknown) => {
        console.error('Error loading full bout details:', err);
        if (setLoader) {
          this.connectionError.set(true);
          this.loading.set(false);
        }
      }
    });
  }

  private connectStream(boutId: number): void {
    this.eventSource = new EventSource(`${environment.apiUrl}/bouts/${boutId}/live`);

    this.eventSource.addEventListener('score-update', (event: MessageEvent) => {
      this.zone.run(() => {
        const update: BoutLiveUpdate = JSON.parse(event.data);
        
        // Optimistic instant local update
        const current = this.bout();
        if (current && current.id === update.boutId) {
          this.bout.set({
            ...current,
            scoreLeft: update.scoreLeft,
            scoreRight: update.scoreRight,
            status: update.status,
            elapsedSeconds: update.elapsedSeconds,
            currentPeriod: update.period
          });
        }
        
        this.localRemaining.set(Math.max(0, 180 - update.elapsedSeconds));
        // Sync clock running state from referee
        this.timerRunning.set(update.timerRunning);
        this.connectionError.set(false);

        // Sync details in the background (no loader) to get latest event list and referees
        this.loadFullDetails(boutId, false);

        if (update.status === 'FINISHED') {
          this.timerRunning.set(false);
          this.eventSource?.close();
        }
      });
    });

    this.eventSource.onerror = () => {
      this.zone.run(() => {
        if (!this.isFinished()) {
          this.connectionError.set(true);
        }
      });
    };
  }

  getProfilePictureUrl(userId: number): string {
    return `${environment.apiUrl}/users/profile-picture/${userId}`;
  }

  getInitials(firstName: string, lastName: string): string {
    const f = firstName ? firstName.charAt(0) : '';
    const l = lastName ? lastName.charAt(0) : '';
    return (f + l).toUpperCase();
  }

  eventLabel(type: EventType): string {
    const map: Record<EventType, string> = {
      TOUCHE: 'Touché',
      YELLOW_CARD: '🟡 Amarilla',
      RED_CARD: '🔴 Roja',
      SCORE_CORRECTION: '↩ Corrección',
      YELLOW_CARD_REMOVAL: '🟡 Quita Amarilla',
      RED_CARD_REMOVAL: '🔴 Quita Roja'
    };
    return map[type] ?? type;
  }

  goBack(): void {
    this.location.back();
  }
}

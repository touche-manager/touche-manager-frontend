import { Component, NgZone, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { BoutLiveUpdate } from '../../../core/models/notification.models';

/**
 * Public live scoreboard for spectators (no auth required).
 * Subscribes to the bout SSE stream and updates the score in real time.
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

  private eventSource: EventSource | null = null;
  private clockInterval: ReturnType<typeof setInterval> | null = null;

  readonly bout = signal<BoutLiveUpdate | null>(null);
  readonly connectionError = signal(false);
  readonly localElapsed = signal(0);

  readonly formattedTime = computed(() => {
    const s = this.localElapsed();
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  });

  readonly isLive = computed(() => this.bout()?.status === 'IN_PROGRESS');
  readonly isFinished = computed(() => this.bout()?.status === 'FINISHED');

  ngOnInit(): void {
    const boutId = +(this.route.snapshot.paramMap.get('boutId') ?? 0);
    this.connectStream(boutId);

    // Local clock: ticks every second while the bout is in progress
    this.clockInterval = setInterval(() => {
      if (this.isLive()) {
        this.localElapsed.update(s => s + 1);
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    this.eventSource?.close();
    if (this.clockInterval) clearInterval(this.clockInterval);
  }

  private connectStream(boutId: number): void {
    this.eventSource = new EventSource(`${environment.apiUrl}/bouts/${boutId}/live`);

    this.eventSource.addEventListener('score-update', (event: MessageEvent) => {
      // EventSource callbacks run outside Angular's zone
      this.zone.run(() => {
        const update: BoutLiveUpdate = JSON.parse(event.data);
        this.bout.set(update);
        this.localElapsed.set(update.elapsedSeconds);
        this.connectionError.set(false);
        if (update.status === 'FINISHED') {
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
}

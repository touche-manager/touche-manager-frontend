import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

/**
 * Manages a per-tournament SSE connection so that the organizer's
 * poule-manager view receives "refresh" events in real time whenever
 * the backend broadcasts a change (score update, poule started, etc.).
 *
 * The JWT is forwarded via query-parameter because the native EventSource
 * API does not support custom request headers.
 */
@Injectable({ providedIn: 'root' })
export class TournamentLiveService {
  private readonly authService = inject(AuthService);

  /** Emits the tournamentId whenever a refresh event is received */
  readonly refresh$ = new Subject<number>();

  private eventSource: EventSource | null = null;
  private currentTournamentId: number | null = null;

  /** Connect (or reconnect) to the SSE stream for the given tournament */
  connect(tournamentId: number): void {
    if (this.currentTournamentId === tournamentId && this.eventSource) return;

    this.disconnect();
    this.currentTournamentId = tournamentId;

    const token = this.authService.token();
    if (!token) return;

    const url = `${environment.apiUrl}/tournaments/${tournamentId}/live?token=${encodeURIComponent(token)}`;
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('refresh', (event: MessageEvent) => {
      const id = Number(event.data);
      this.refresh$.next(id);
    });

    this.eventSource.onerror = () => {
      // EventSource reconnects automatically on transient errors.
      // If the stream is closed we leave it – the organizer can manually refresh.
    };
  }

  /** Disconnect from the active SSE stream */
  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.currentTournamentId = null;
  }
}

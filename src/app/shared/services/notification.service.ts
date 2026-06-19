import { Injectable, computed, inject, signal, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NotificationDTO, NotifyUpcomingBoutRequest } from '../../core/models/notification.models';
import { AuthService } from '../../core/services/auth.service';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Manages the notification state for the authenticated user.
 *
 * Real-time delivery is handled via Server-Sent Events (SSE):
 *   GET /api/notifications/stream?token=<JWT>
 *
 * The JWT is passed as a query parameter because the browser's native
 * EventSource API does not support custom request headers.
 *
 * Notifications are always persisted in the DB, so users who were offline
 * will see them the next time they open the app (via loadHistory).
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly base = `${environment.apiUrl}/notifications`;

  readonly notifications = signal<NotificationDTO[]>([]);
  readonly unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  /** Emits each new notification received via SSE in real time */
  readonly newNotification$ = new Subject<NotificationDTO>();

  private eventSource: EventSource | null = null;
  private listening = false;

  /** Open the SSE stream and load notification history */
  startListening(): void {
    if (this.listening) return;
    this.listening = true;

    this.loadHistory();
    this.connectSse();
  }

  stopListening(): void {
    this.listening = false;
    this.closeSse();
    this.notifications.set([]);
  }

  loadHistory(): void {
    this.http.get<ApiResponse<NotificationDTO[]>>(`${this.base}/mine`)
      .pipe(map(r => r.data))
      .subscribe({
        next: (data) => this.notifications.set(data),
        error: () => {}
      });
  }

  markAsRead(id: number): Observable<NotificationDTO> {
    return this.http.put<ApiResponse<NotificationDTO>>(`${this.base}/${id}/read`, {})
      .pipe(
        map(r => r.data),
        tap(updated => this.notifications.update(list =>
          list.map(n => n.id === updated.id ? updated : n)))
      );
  }

  markAllAsRead(): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.base}/read-all`, {})
      .pipe(
        map(r => r.data),
        tap(() => this.notifications.update(list => list.map(n => ({ ...n, read: true }))))
      );
  }

  /** Summon the athletes of a bout ("your bout starts in N minutes") */
  notifyUpcomingBout(boutId: number, request: NotifyUpcomingBoutRequest): Observable<NotificationDTO[]> {
    return this.http.post<ApiResponse<NotificationDTO[]>>(
      `${environment.apiUrl}/bouts/${boutId}/notify-upcoming`, request
    ).pipe(map(r => r.data));
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private connectSse(): void {
    const token = this.authService.token();
    if (!token) return;

    this.closeSse(); // close any existing connection

    const url = `${environment.apiUrl}/notifications/stream?token=${encodeURIComponent(token)}`;
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('notification', (event: MessageEvent) => {
      const notification: NotificationDTO = JSON.parse(event.data);
      this.notifications.update(list => [notification, ...list]);
      this.newNotification$.next(notification);
    });

    this.eventSource.onerror = () => {
      // EventSource reconnects automatically on transient errors.
      // If the token has expired the reconnect will fail with 401/403;
      // the user will simply not receive live pushes until they log in again
      // (they will still see all notifications on the next loadHistory call).
    };
  }

  private closeSse(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

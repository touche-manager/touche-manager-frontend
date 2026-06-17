import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IMessage } from '@stomp/stompjs';
import { Observable, Subject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NotificationDTO, NotifyUpcomingBoutRequest } from '../../core/models/notification.models';
import { WebsocketService } from './websocket.service';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Loads the notification history and listens to the personal WebSocket queue
 * (/user/queue/notifications) for real-time pushes.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly websocketService = inject(WebsocketService);
  private readonly base = `${environment.apiUrl}/notifications`;

  private static readonly QUEUE_DESTINATION = '/user/queue/notifications';

  readonly notifications = signal<NotificationDTO[]>([]);
  readonly unreadCount = computed(() => this.notifications().filter(n => !n.read).length);

  /** Emits each new notification received via WebSocket in real time */
  readonly newNotification$ = new Subject<NotificationDTO>();

  private listening = false;

  /** Connect the WebSocket and start receiving real-time notifications */
  startListening(): void {
    if (this.listening) return;
    this.listening = true;

    this.loadHistory();
    this.websocketService.connect();
    this.websocketService.subscribe(NotificationService.QUEUE_DESTINATION, (message: IMessage) => {
      const notification: NotificationDTO = JSON.parse(message.body);
      this.notifications.update(list => [notification, ...list]);
      this.newNotification$.next(notification);  // trigger toast
    });
  }

  stopListening(): void {
    this.listening = false;
    this.websocketService.unsubscribe(NotificationService.QUEUE_DESTINATION);
    this.websocketService.disconnect();
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
}

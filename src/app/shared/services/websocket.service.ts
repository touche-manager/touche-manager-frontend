import { Injectable, inject, signal } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';

/**
 * Manages the STOMP-over-SockJS connection against the backend /ws endpoint.
 * Authenticates the CONNECT frame with the JWT and reconnects automatically.
 */
@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private readonly authService = inject(AuthService);

  private client: Client | null = null;
  private subscriptions = new Map<string, StompSubscription>();
  private pendingSubscriptions = new Map<string, (message: IMessage) => void>();

  readonly connected = signal(false);

  /** Open the STOMP connection (no-op if already active) */
  connect(): void {
    if (this.client?.active) return;
    const token = this.authService.token();
    if (!token) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected.set(true);
        // Re-subscribe everything requested before/across reconnections
        this.pendingSubscriptions.forEach((callback, destination) => {
          this.doSubscribe(destination, callback);
        });
      },
      onDisconnect: () => this.connected.set(false),
      onWebSocketClose: () => this.connected.set(false)
    });
    this.client.activate();
  }

  /** Subscribe to a destination; kept alive across reconnections */
  subscribe(destination: string, callback: (message: IMessage) => void): void {
    this.pendingSubscriptions.set(destination, callback);
    if (this.client?.connected) {
      this.doSubscribe(destination, callback);
    }
  }

  unsubscribe(destination: string): void {
    this.pendingSubscriptions.delete(destination);
    const sub = this.subscriptions.get(destination);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  disconnect(): void {
    this.subscriptions.clear();
    this.pendingSubscriptions.clear();
    this.client?.deactivate();
    this.client = null;
    this.connected.set(false);
  }

  private doSubscribe(destination: string, callback: (message: IMessage) => void): void {
    this.subscriptions.get(destination)?.unsubscribe();
    if (!this.client) return;
    this.subscriptions.set(destination, this.client.subscribe(destination, callback));
  }
}

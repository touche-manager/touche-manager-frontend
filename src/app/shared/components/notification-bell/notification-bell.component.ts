import { Component, OnDestroy, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationDTO } from '../../../core/models/notification.models';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative">
      <!-- Bell button -->
      <button
        id="btn-notification-bell"
        (click)="togglePanel()"
        title="Notificaciones"
        class="relative inline-flex items-center justify-center p-1.5 rounded-lg text-touche-celeste
               bg-white/5 hover:bg-white/10 border border-touche-celeste/40 shadow-sm
               transition-all duration-150 focus:outline-none focus:ring-2
               focus:ring-offset-2 focus:ring-touche-celeste"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        @if (unreadCount() > 0) {
          <span class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full
                       bg-touche-alert text-white text-[10px] font-bold flex items-center
                       justify-center border border-touche-navy">
            {{ unreadCount() > 99 ? '99+' : unreadCount() }}
          </span>
        }
      </button>

      <!-- Dropdown panel -->
      @if (showPanel()) {
        <div class="fixed inset-0 z-40" (click)="showPanel.set(false)"></div>
        <div class="absolute right-0 mt-2 w-80 max-w-[90vw] z-50 bg-white rounded-2xl shadow-2xl
                    border border-touche-navy/10 overflow-hidden animate-fade-in">

          <!-- Panel header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-touche-navy/10 bg-touche-navy">
            <h3 class="font-display text-base font-bold text-white">Notificaciones</h3>
            @if (unreadCount() > 0) {
              <button
                id="btn-mark-all-read"
                (click)="markAllAsRead()"
                class="text-xs font-semibold text-touche-celeste hover:text-white transition-colors"
              >
                Marcar todas como leídas
              </button>
            }
          </div>

          <!-- Notification list -->
          <div class="max-h-96 overflow-y-auto">
            @if (notifications().length === 0) {
              <div class="px-4 py-10 text-center text-touche-navy/50">
                <svg class="h-8 w-8 mx-auto mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p class="text-sm">No tenés notificaciones</p>
              </div>
            }
            @for (notification of notifications(); track notification.id) {
              <button
                (click)="onNotificationClick(notification)"
                class="w-full text-left px-4 py-3 border-b border-touche-navy/5 transition-colors
                       hover:bg-touche-celeste/5"
                [class.bg-touche-celeste]="false"
                [ngClass]="notification.read ? 'bg-white' : 'bg-touche-celeste/10'"
              >
                <div class="flex items-start gap-2.5">
                  <span class="mt-0.5 flex-shrink-0 w-2 h-2 rounded-full"
                        [ngClass]="notification.read ? 'bg-transparent' : 'bg-touche-celeste'"></span>
                  <div class="min-w-0">
                    <p class="text-sm text-touche-navy leading-snug"
                       [class.font-semibold]="!notification.read">
                      {{ notification.message }}
                    </p>
                    <p class="text-[11px] text-touche-navy/50 mt-1">
                      {{ notification.createdAt | date:'dd/MM/yyyy HH:mm' }}
                    </p>
                  </div>
                </div>
              </button>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class NotificationBellComponent implements OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly notifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly showPanel = signal(false);

  constructor() {
    // Connect/disconnect the realtime channel following the session state
    effect(() => {
      const authenticated = this.authService.isAuthenticated();
      untracked(() => {
        if (authenticated) {
          this.notificationService.startListening();
        } else {
          this.notificationService.stopListening();
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.notificationService.stopListening();
  }

  togglePanel(): void {
    this.showPanel.update(v => !v);
  }

  onNotificationClick(notification: NotificationDTO): void {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id).subscribe();
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }
}

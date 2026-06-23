import { Component, OnInit, OnDestroy, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { NotificationDTO, NotificationType } from '../../../core/models/notification.models';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html'
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly notifications = this.notificationService.notifications;
  readonly unreadCount = this.notificationService.unreadCount;
  readonly showPanel = signal(false);
  readonly isAnimating = signal(false);

  private newNotificationSub: Subscription | null = null;

  constructor() {
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

  ngOnInit(): void {
    this.newNotificationSub = this.notificationService.newNotification$.subscribe(() => {
      this.triggerAnimation();
    });
  }

  ngOnDestroy(): void {
    this.newNotificationSub?.unsubscribe();
    this.notificationService.stopListening();
  }

  triggerAnimation(): void {
    this.isAnimating.set(true);
    setTimeout(() => {
      this.isAnimating.set(false);
    }, 1000);
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

  hasRoute(n: NotificationDTO): boolean {
    return this.buildRoute(n) !== null;
  }

  navigate(n: NotificationDTO): void {
    const route = this.buildRoute(n);
    if (!route) return;
    if (!n.read) {
      this.notificationService.markAsRead(n.id).subscribe();
    }
    this.showPanel.set(false);
    this.router.navigate(route.commands, route.extras ?? {});
  }

  private buildRoute(n: NotificationDTO): { commands: any[]; extras?: any } | null {
    switch (n.type as NotificationType) {
      case 'REFEREE_REQUEST':
        // Organizer → tournament hub, árbitros tab
        if (n.tournamentId) {
          return {
            commands: ['/tournament', n.tournamentId],
            extras: { queryParams: { tab: 'referees' } }
          };
        }
        return null;

      case 'REFEREE_CONFIRMATION':
      case 'REFEREE_ASSIGNMENT':
        // Referee → their bout dashboard
        return { commands: ['/bout'] };

      case 'YOUR_TURN':
      case 'NEXT_UP':
      case 'UPCOMING_BOUT':
        // Referee / Athlete → scorer if boutId available
        if (n.boutId) {
          return { commands: ['/bout', n.boutId, 'score'] };
        }
        return null;

      case 'DOCUMENT_REJECTED':
        // Athlete → their profile, documents tab
        return { commands: ['/athlete'], extras: { queryParams: { tab: 'documents' } } };

      case 'TOURNAMENT_STARTED':
        if (n.tournamentId) {
          return { commands: ['/tournament', n.tournamentId] };
        }
        return null;

      default:
        return null;
    }
  }
}

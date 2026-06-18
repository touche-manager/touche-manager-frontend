import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { NotificationDTO, NotificationType } from '../../../core/models/notification.models';

interface ToastItem {
  id: number;
  notification: NotificationDTO;
  removing: boolean;
}

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      aria-live="assertive"
      class="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none"
    >
      @for (item of toasts(); track item.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 w-80 max-w-[90vw]
                 bg-white rounded-2xl shadow-2xl border border-touche-navy/10
                 px-4 py-3 transition-all duration-300"
          [class.opacity-0]="item.removing"
          [class.translate-y-2]="item.removing"
        >
          <!-- Icon -->
          <div
            class="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-lg"
            [ngClass]="getIconBg(item.notification.type)"
          >
            {{ getIcon(item.notification.type) }}
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-xs font-bold uppercase tracking-wide mb-0.5"
               [ngClass]="getTitleColor(item.notification.type)">
              {{ getTitle(item.notification.type) }}
            </p>
            <p class="text-sm text-touche-navy leading-snug">
              {{ item.notification.message }}
            </p>
          </div>

          <!-- Close -->
          <button
            (click)="dismiss(item.id)"
            class="flex-shrink-0 text-touche-navy/40 hover:text-touche-navy transition-colors mt-0.5"
            aria-label="Cerrar notificación"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
    </div>
  `
})
export class NotificationToastComponent implements OnInit, OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private subscription: Subscription | null = null;
  private nextId = 0;

  readonly toasts = signal<ToastItem[]>([]);

  ngOnInit(): void {
    this.subscription = this.notificationService.newNotification$.subscribe(notification => {
      this.addToast(notification);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  addToast(notification: NotificationDTO): void {
    const id = this.nextId++;
    this.toasts.update(list => [...list, { id, notification, removing: false }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => this.dismiss(id), 5000);
  }

  dismiss(id: number): void {
    // Start removal animation
    this.toasts.update(list =>
      list.map(t => t.id === id ? { ...t, removing: true } : t)
    );
    // Remove from DOM after transition completes
    setTimeout(() => {
      this.toasts.update(list => list.filter(t => t.id !== id));
    }, 300);
  }

  getIcon(type: NotificationType): string {
    switch (type) {
      case 'YOUR_TURN':          return '⚔️';
      case 'NEXT_UP':            return '🔜';
      case 'REFEREE_ASSIGNMENT': return '🏷️';
      case 'REFEREE_REQUEST':    return '📩';
      case 'REFEREE_CONFIRMATION': return '✅';
      case 'TOURNAMENT_STARTED': return '🏁';
      case 'UPCOMING_BOUT':      return '⏰';
      case 'DOCUMENT_REJECTED':  return '❌';
      default:                   return '🔔';
    }
  }

  getIconBg(type: NotificationType): string {
    switch (type) {
      case 'YOUR_TURN':          return 'bg-emerald-100 text-emerald-700';
      case 'NEXT_UP':            return 'bg-blue-100 text-blue-700';
      case 'REFEREE_ASSIGNMENT': return 'bg-indigo-100 text-indigo-700';
      case 'REFEREE_REQUEST':    return 'bg-amber-100 text-amber-700';
      case 'REFEREE_CONFIRMATION': return 'bg-emerald-100 text-emerald-700';
      case 'TOURNAMENT_STARTED': return 'bg-touche-celeste/20 text-touche-navy';
      case 'UPCOMING_BOUT':      return 'bg-orange-100 text-orange-700';
      case 'DOCUMENT_REJECTED':  return 'bg-red-100 text-red-700';
      default:                   return 'bg-gray-100 text-gray-600';
    }
  }

  getTitle(type: NotificationType): string {
    switch (type) {
      case 'YOUR_TURN':          return '¡Es tu turno!';
      case 'NEXT_UP':            return 'Próximo asalto';
      case 'REFEREE_ASSIGNMENT': return 'Asignación de poule';
      case 'REFEREE_REQUEST':    return 'Nueva postulación';
      case 'REFEREE_CONFIRMATION': return 'Postulación revisada';
      case 'TOURNAMENT_STARTED': return 'Torneo iniciado';
      case 'UPCOMING_BOUT':      return 'Asalto próximo';
      case 'DOCUMENT_REJECTED':  return 'Documento rechazado';
      default:                   return 'Notificación';
    }
  }

  getTitleColor(type: NotificationType): string {
    switch (type) {
      case 'YOUR_TURN':            return 'text-emerald-600';
      case 'NEXT_UP':              return 'text-blue-600';
      case 'REFEREE_ASSIGNMENT':   return 'text-indigo-600';
      case 'REFEREE_REQUEST':      return 'text-amber-600';
      case 'REFEREE_CONFIRMATION': return 'text-emerald-600';
      case 'TOURNAMENT_STARTED':   return 'text-touche-navy';
      case 'UPCOMING_BOUT':        return 'text-orange-600';
      case 'DOCUMENT_REJECTED':    return 'text-red-600';
      default:                     return 'text-touche-navy';
    }
  }
}

import { Component, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { RefereeApplicationService } from '../../services/referee-application.service';
import {
  RefereeApplicationResponse,
  RefereeApplicationStatus
} from '../../../../core/models/tournament.models';
import { LabelPipe } from '../../../../shared/pipes/label.pipe';
import { NotificationService } from '../../../../shared/services/notification.service';

@Component({
  selector: 'app-referee-applications',
  standalone: true,
  imports: [CommonModule, LabelPipe],
  templateUrl: './referee-applications.component.html'
})
export class RefereeApplicationsComponent implements OnInit, OnDestroy {
  @Input() tournamentId!: number;
  private readonly service = inject(RefereeApplicationService);
  private readonly notificationService = inject(NotificationService);
  private notifSub: Subscription | null = null;

  readonly applications = signal<RefereeApplicationResponse[]>([]);
  readonly loading = signal(true);

  // statusLabel handled by LabelPipe in template

  ngOnInit(): void {
    this.load();
    // Auto-reload silently when a referee applies to THIS tournament
    // Uses == instead of === to handle any JSON number/string coercion edge cases
    this.notifSub = this.notificationService.newNotification$.subscribe(n => {
      // eslint-disable-next-line eqeqeq
      if (n.type === 'REFEREE_REQUEST' && n.tournamentId == this.tournamentId) {
        this.silentReload();
      }
    });
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
  }

  /** Initial load — shows the spinner */
  load(): void {
    this.loading.set(true);
    this.service.getApplicationsForTournament(this.tournamentId).subscribe({
      next: (data) => { this.applications.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  /** Silent reload triggered by SSE notification — no spinner, no visual disruption */
  private silentReload(): void {
    this.service.getApplicationsForTournament(this.tournamentId).subscribe({
      next: (data) => this.applications.set(data),
      error: () => {}
    });
  }

  review(id: number, status: RefereeApplicationStatus): void {
    this.service.review(id, status).subscribe({
      next: (updated) => this.applications.update(apps =>
        apps.map(a => a.id === id ? updated : a)
      )
    });
  }

  statusBadge(s: RefereeApplicationStatus): string {
    return s === 'ACCEPTED' ? 'badge-success' : 'badge-danger';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}

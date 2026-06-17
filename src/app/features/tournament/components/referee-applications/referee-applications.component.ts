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
    // Auto-reload when a referee applies to THIS tournament
    this.notifSub = this.notificationService.newNotification$.subscribe(n => {
      if (n.type === 'REFEREE_REQUEST' && n.tournamentId === this.tournamentId) {
        this.load();
      }
    });
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
  }

  load(): void {
    this.service.getApplicationsForTournament(this.tournamentId).subscribe({
      next: (data) => { this.applications.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
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

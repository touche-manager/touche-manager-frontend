import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RefereeApplicationService } from '../../services/referee-application.service';
import {
  RefereeApplicationResponse,
  RefereeApplicationStatus
} from '../../../../core/models/tournament.models';
import { LabelPipe } from '../../../../shared/pipes/label.pipe';

@Component({
  selector: 'app-referee-applications',
  standalone: true,
  imports: [CommonModule, LabelPipe],
  templateUrl: './referee-applications.component.html'
})
export class RefereeApplicationsComponent implements OnInit {
  @Input() tournamentId!: number;
  private readonly service = inject(RefereeApplicationService);

  readonly applications = signal<RefereeApplicationResponse[]>([]);
  readonly loading = signal(true);

  // statusLabel handled by LabelPipe in template

  ngOnInit(): void {
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
    return s === 'ACCEPTED' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
}

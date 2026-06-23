import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BoutService } from '../../services/bout.service';
import {
  BoutResponse, BoutFormatLabels, BoutStatusLabels, BoutStatus
} from '../../../../core/models/bout.models';

@Component({
  selector: 'app-bout-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bout-list.component.html'
})
export class BoutListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly boutService = inject(BoutService);

  private tournamentId = 0;

  readonly bouts = signal<BoutResponse[]>([]);
  readonly loading = signal(true);

  readonly statusLabel = (s: BoutStatus) => BoutStatusLabels[s] ?? s;
  readonly formatLabel = (f: string) => BoutFormatLabels[f as keyof typeof BoutFormatLabels] ?? f;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.tournamentId = id ? +id : 0;
    this.loadBouts();
  }

  loadBouts(): void {
    this.loading.set(true);
    this.boutService.getMyBouts(this.tournamentId).subscribe({
      next: (data) => { this.bouts.set(data); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openScorer(boutId: number): void {
    this.router.navigate(['/bout', this.tournamentId, 'score', boutId]);
  }

  goBack(): void {
    this.router.navigate(['/bout']);
  }

  statusBadgeClass(status: BoutStatus): string {
    const map: Record<BoutStatus, string> = {
      PENDING: 'bg-white/10 text-white/50',
      IN_PROGRESS: 'bg-green-500/20 text-green-400',
      FINISHED: 'bg-white/10 text-touche-celeste'
    };
    return map[status] ?? '';
  }
}

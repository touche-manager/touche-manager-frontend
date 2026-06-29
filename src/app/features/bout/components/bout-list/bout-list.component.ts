import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { BoutService } from '../../services/bout.service';
import { PouleService } from '../../../tournament/services/poule.service';
import { AlertService } from '../../../../shared/services/alert.service';
import {
  BoutResponse, BoutFormatLabels, BoutStatusLabels, BoutStatus
} from '../../../../core/models/bout.models';
import { PouleResponse } from '../../../../core/models/tournament.models';
import { ELIMINATION_ROUND_LABELS } from '../../../../shared/utils/label.maps';

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
  private readonly pouleService = inject(PouleService);
  private readonly alertService = inject(AlertService);

  private tournamentId = 0;

  readonly poules = signal<PouleResponse[]>([]);
  readonly eliminationBouts = signal<BoutResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<'poules' | 'eliminations'>('poules');

  // Track which poules are in the process of starting
  readonly startingPoules = signal<Record<number, boolean>>({});

  readonly statusLabel = (s: BoutStatus) => BoutStatusLabels[s] ?? s;
  readonly formatLabel = (f: string) => BoutFormatLabels[f as keyof typeof BoutFormatLabels] ?? f;

  readonly tournamentName = computed(() => {
    if (this.poules().length > 0) return this.poules()[0].tournamentName;
    if (this.eliminationBouts().length > 0) return this.eliminationBouts()[0].tournamentName;
    return 'Torneo';
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.tournamentId = id ? +id : 0;
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      poules: this.pouleService.getRefereePoules(this.tournamentId),
      bouts: this.boutService.getMyBouts(this.tournamentId)
    }).subscribe({
      next: (res) => {
        this.poules.set(res.poules);
        // Bouts with pouleId == null are elimination matches
        this.eliminationBouts.set(res.bouts.filter(b => b.pouleId == null));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading referee assignments', err);
        this.error.set('No se pudieron cargar tus asignaciones. Aseguráte de estar aceptado como árbitro en este torneo.');
        this.loading.set(false);
      }
    });
  }

  openPoule(pouleId: number): void {
    this.router.navigate(['/bout', this.tournamentId, 'poules', pouleId]);
  }

  openScorer(boutId: number): void {
    this.router.navigate(['/bout', this.tournamentId, 'score', boutId]);
  }

  startPoule(pouleId: number, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.startingPoules.update(m => ({ ...m, [pouleId]: true }));
    this.pouleService.startPoule(pouleId).subscribe({
      next: (updated) => {
        this.poules.update(list => list.map(p => p.id === updated.id ? updated : p));
        this.startingPoules.update(m => ({ ...m, [pouleId]: false }));
      },
      error: (err) => {
        console.error('Error al iniciar la poule', err);
        this.alertService.error('Error', err?.error?.message || 'No se pudo iniciar la poule.');
        this.startingPoules.update(m => ({ ...m, [pouleId]: false }));
      }
    });
  }

  getPoulePiste(poule: PouleResponse): string {
    const boutWithPiste = poule.bouts.find(b => b.piste);
    return boutWithPiste?.piste || 'A confirmar';
  }

  getClubAbbreviation(club: string | null): string {
    if (!club) return '—';
    const clean = club.trim();
    if (clean.length <= 4) return clean.toUpperCase();
    
    const stopWords = ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'para', 'con', 'a', 'association', 'asociacion', 'club', 'federacion', 'fencing', 'esgrima'];
    const words = clean.split(/[\s,\-]+/)
      .filter(w => w.length > 1 && !stopWords.includes(w.toLowerCase()));
      
    if (words.length >= 2) {
      return words.map(w => w[0]).join('').toUpperCase();
    }
    return clean.substring(0, 3).toUpperCase();
  }

  eliminationRoundLabel(round: string | null): string {
    if (!round) return 'Asalto';
    return ELIMINATION_ROUND_LABELS[round as keyof typeof ELIMINATION_ROUND_LABELS] ?? round;
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

  boutCardClass(status: string): string {
    const base = 'border transition-all duration-150 ';
    if (status === 'FINISHED') return base + 'border-slate-100 bg-slate-50/40 opacity-75';
    if (status === 'IN_PROGRESS') return base + 'border-amber-200 bg-amber-50/5 ring-1 ring-amber-200 shadow-md';
    return base + 'border-slate-150 hover:border-slate-250';
  }

  getWinnerName(bout: BoutResponse): string {
    if (!bout.winnerId) return '—';
    if (bout.winnerId === bout.athleteLeft.id) {
      return bout.athleteLeft.firstName + ' ' + bout.athleteLeft.lastName;
    }
    if (bout.athleteRight && bout.winnerId === bout.athleteRight.id) {
      return bout.athleteRight.firstName + ' ' + bout.athleteRight.lastName;
    }
    return '—';
  }
}

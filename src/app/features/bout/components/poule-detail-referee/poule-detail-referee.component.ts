import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { PouleResponse, BoutResponse } from '../../../../core/models/tournament.models';
import { PouleService } from '../../../tournament/services/poule.service';
import { AlertService } from '../../../../shared/services/alert.service';

interface ApiResponse<T> { success: boolean; data: T; }

@Component({
  selector: 'app-poule-detail-referee',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poule-detail-referee.component.html'
})
export class PouleDetailRefereeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly pouleService = inject(PouleService);
  private readonly alertService = inject(AlertService);

  readonly poule = signal<PouleResponse | null>(null);
  readonly loading = signal(true);
  readonly isStarting = signal(false);

  readonly sortedBouts = computed(() => {
    const p = this.poule();
    if (!p) return [];
    return [...p.bouts].sort((a, b) => {
      const aIsNext = this.isNextBout(a.id);
      const bIsNext = this.isNextBout(b.id);
      if (aIsNext && !bIsNext) return -1;
      if (!aIsNext && bIsNext) return 1;

      const aIsFinished = a.status === 'FINISHED';
      const bIsFinished = b.status === 'FINISHED';
      if (!aIsFinished && bIsFinished) return -1;
      if (aIsFinished && !bIsFinished) return 1;

      const aOrder = a.boutOrder ?? 0;
      const bOrder = b.boutOrder ?? 0;
      return aOrder - bOrder;
    });
  });

  ngOnInit(): void {
    const pouleId = +this.route.snapshot.paramMap.get('pouleId')!;
    this.http.get<ApiResponse<PouleResponse>>(`${environment.apiUrl}/poules/${pouleId}`)
      .pipe(map(r => r.data))
      .subscribe({
        next: (data) => { 
          this.poule.set(data); 
          this.loading.set(false); 
        },
        error: () => this.loading.set(false)
      });
  }

  progress(): number {
    const p = this.poule();
    if (!p || p.totalBouts === 0) return 0;
    return Math.round((p.finishedBouts / p.totalBouts) * 100);
  }

  scoreBout(boutId: number): void {
    const p = this.poule();
    if (p) {
      this.router.navigate(['/bout', p.tournamentId, 'score', boutId]);
    }
  }

  startPoule(): void {
    const poule = this.poule();
    if (!poule) return;
    this.isStarting.set(true);
    this.pouleService.startPoule(poule.id).subscribe({
      next: (updated) => {
        this.poule.set(updated);
        this.isStarting.set(false);
      },
      error: (err) => {
        console.error('Error al iniciar la poule', err);
        this.alertService.error('Error', err?.error?.message || 'No se pudo iniciar la poule. Verificá que estés asignado como árbitro.');
        this.isStarting.set(false);
      }
    });
  }

  goBack(): void {
    const poule = this.poule();
    if (poule) this.router.navigate(['/bout', poule.tournamentId, 'bouts']);
    else this.router.navigate(['/bout']);
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

  isNextBout(boutId: number): boolean {
    const p = this.poule();
    if (!p) return false;
    const nextBout = p.bouts.find(b => b.status !== 'FINISHED');
    return nextBout ? nextBout.id === boutId : false;
  }

  getWinnerName(bout: BoutResponse): string {
    if (bout.winnerId === bout.athleteLeft.id) {
      return bout.athleteLeft.firstName + ' ' + bout.athleteLeft.lastName;
    }
    if (bout.athleteRight && bout.winnerId === bout.athleteRight.id) {
      return bout.athleteRight.firstName + ' ' + bout.athleteRight.lastName;
    }
    return '—';
  }

  boutCardClass(status: string, isNext: boolean): string {
    const base = 'border transition-all duration-150 ';
    if (status === 'FINISHED') {
      return base + 'border-slate-100 bg-slate-50/40 opacity-75';
    }
    if (status === 'IN_PROGRESS') {
      return base + 'border-amber-200 bg-amber-50/5 ring-1 ring-amber-200 shadow-md';
    }
    if (isNext && this.poule()?.status === 'IN_PROGRESS') {
      return base + 'border-touche-celeste/60 bg-touche-celeste/5 ring-1 ring-touche-celeste/20';
    }
    return base + 'border-slate-150 hover:border-slate-250';
  }
}

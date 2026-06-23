import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PouleService } from '../../../tournament/services/poule.service';
import { PouleResponse } from '../../../../core/models/tournament.models';
import { AlertService } from '../../../../shared/services/alert.service';

@Component({
  selector: 'app-poule-list-referee',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './poule-list-referee.component.html'
})
export class PouleListRefereeComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pouleService = inject(PouleService);
  private readonly alertService = inject(AlertService);

  readonly tournamentId = signal<number>(0);
  readonly poules = signal<PouleResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Track which poules are in the process of starting
  readonly startingPoules = signal<Record<number, boolean>>({});

  ngOnInit(): void {
    const id = +this.route.snapshot.paramMap.get('id')!;
    if (isNaN(id) || id <= 0) {
      this.error.set('Identificador de torneo inválido.');
      this.loading.set(false);
      return;
    }
    this.tournamentId.set(id);
    this.loadPoules();
  }

  loadPoules(): void {
    this.loading.set(true);
    this.pouleService.getRefereePoules(this.tournamentId()).subscribe({
      next: (data) => {
        this.poules.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading referee poules', err);
        this.error.set('No se pudieron cargar tus poules asignadas. Aseguráte de estar registrado como árbitro y aceptado en este torneo.');
        this.loading.set(false);
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
    
    // Try to generate initials
    const stopWords = ['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', 'para', 'con', 'a', 'association', 'asociacion', 'club', 'federacion', 'fencing', 'esgrima'];
    const words = clean.split(/[\s,\-]+/)
      .filter(w => w.length > 1 && !stopWords.includes(w.toLowerCase()));
      
    if (words.length >= 2) {
      return words.map(w => w[0]).join('').toUpperCase();
    }
    return clean.substring(0, 3).toUpperCase();
  }

  getButtonClass(status: string): string {
    const base = 'w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ';
    if (status === 'IN_PROGRESS') {
      return base + 'bg-touche-celeste text-touche-navy hover:bg-opacity-90 hover:scale-[1.01]';
    }
    return base + 'btn-ghost';
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
        this.alertService.error('Error', err?.error?.message || 'No se pudo iniciar la poule. Verificá que estés asignado como árbitro.');
        this.startingPoules.update(m => ({ ...m, [pouleId]: false }));
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/bout']);
  }
}

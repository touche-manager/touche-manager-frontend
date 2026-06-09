import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizerTournamentService } from '../../services/organizer-tournament.service';
import {
  EnrollmentDetailResponse,
  EnrollmentStatus,
  DocumentValidationStatus,
  DocumentValidationRequest,
  TournamentPhase,
  OrganizerTournamentResponse
} from '../../../../core/models/tournament.models';
import { RefereeApplicationsComponent } from '../referee-applications/referee-applications.component';
import { LabelPipe } from '../../../../shared/pipes/label.pipe';

@Component({
  selector: 'app-tournament-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RefereeApplicationsComponent, LabelPipe],
  templateUrl: './tournament-detail.component.html'
})
export class TournamentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tournamentService = inject(OrganizerTournamentService);

  tournamentId = 0;

  readonly enrollments = signal<EnrollmentDetailResponse[]>([]);
  readonly activeFilter = signal<EnrollmentStatus | 'ALL'>('ALL');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly tournamentPhase = signal<TournamentPhase | null>(null);

  readonly filterTabs: { value: EnrollmentStatus | 'ALL'; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'PAID', label: 'Pagos' },
    { value: 'PENDING_PAYMENT', label: 'Pendientes' },
    { value: 'CANCELLED', label: 'Cancelados' }
  ];

  readonly filteredEnrollments = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'ALL') return this.enrollments();
    return this.enrollments().filter(e => e.status === filter);
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.tournamentId = id ? +id : 0;
    this.loadEnrollments();
    this.loadTournamentPhase();
  }

  loadTournamentPhase(): void {
    this.tournamentService.getTournamentById(this.tournamentId).subscribe({
      next: (t: any) => this.tournamentPhase.set(t.phase ?? null),
      error: () => {}
    });
  }

  loadEnrollments(): void {
    this.loading.set(true);
    this.tournamentService.getEnrollments(this.tournamentId).subscribe({
      next: (data) => { this.enrollments.set(data); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar inscriptos.'); this.loading.set(false); }
    });
  }

  setFilter(f: EnrollmentStatus | 'ALL'): void {
    this.activeFilter.set(f);
  }

  countByStatus(status: EnrollmentStatus | 'ALL'): number {
    if (status === 'ALL') return this.enrollments().length;
    return this.enrollments().filter(e => e.status === status).length;
  }

  validateDoc(documentId: number, status: DocumentValidationStatus, enrollment: EnrollmentDetailResponse): void {
    const req: DocumentValidationRequest = { validationStatus: status };
    this.tournamentService.validateDocument(documentId, req).subscribe({
      next: () => this.loadEnrollments(),
      error: () => alert('Error al actualizar el estado del documento.')
    });
  }

  rejectDoc(documentId: number, enrollment: EnrollmentDetailResponse): void {
    const notes = prompt('Motivo del rechazo (opcional):') ?? '';
    const req: DocumentValidationRequest = { validationStatus: 'REJECTED', reviewNotes: notes };
    this.tournamentService.validateDocument(documentId, req).subscribe({
      next: () => this.loadEnrollments(),
      error: () => alert('Error al rechazar el documento.')
    });
  }

  // Labels handled by LabelPipe in template

  statusBadgeClass(status: EnrollmentStatus): string {
    const map: Record<EnrollmentStatus, string> = {
      PAID: 'bg-green-500/20 text-green-400',
      PENDING_PAYMENT: 'bg-yellow-500/20 text-yellow-400',
      CANCELLED: 'bg-white/10 text-white/40'
    };
    return map[status] ?? 'bg-white/10 text-white/40';
  }

  validationBadgeClass(status: DocumentValidationStatus): string {
    const map: Record<DocumentValidationStatus, string> = {
      PENDING: 'bg-yellow-500/20 text-yellow-400',
      APPROVED: 'bg-green-500/20 text-green-400',
      REJECTED: 'bg-red-500/20 text-red-400'
    };
    return map[status] ?? '';
  }

  // phaseLabel handled by LabelPipe in template

  phaseBadgeClass(phase: TournamentPhase): string {
    const map: Record<TournamentPhase, string> = {
      ENROLLMENT: 'bg-blue-500/20 text-blue-400',
      POULES_IN_PROGRESS: 'bg-yellow-500/20 text-yellow-400',
      ELIMINATION_IN_PROGRESS: 'bg-orange-500/20 text-orange-400',
      FINISHED: 'bg-green-500/20 text-green-400'
    };
    return map[phase] ?? 'bg-white/10 text-white/40';
  }

  goToPoules(): void {
    this.router.navigate(['/tournament', this.tournamentId, 'poules']);
  }

  goToResults(): void {
    this.router.navigate(['/results', this.tournamentId]);
  }

  goBack(): void {
    this.router.navigate(['/tournament']);
  }
}


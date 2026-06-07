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
  EnrollmentStatusLabels,
  DocumentValidationStatusLabels,
  DocumentTypeLabels,
  TournamentPhase,
  TournamentPhaseLabels,
  OrganizerTournamentResponse
} from '../../../../core/models/tournament.models';
import { RefereeApplicationsComponent } from '../referee-applications/referee-applications.component';

@Component({
  selector: 'app-tournament-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RefereeApplicationsComponent],
  template: `
    <div class="min-h-screen bg-touche-navy p-4 md:p-8">
      <div class="max-w-5xl mx-auto">

        <!-- Header -->
        <div class="flex items-center gap-4 mb-8">
          <button (click)="goBack()" class="text-touche-celeste hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-white">Atletas Inscriptos</h1>
            <p class="text-touche-celeste/70 text-sm mt-0.5">Gestión de inscripciones y validación de documentos</p>
          </div>
          <!-- Phase badge + action button -->
          @if (tournamentPhase()) {
            <div class="flex items-center gap-3">
              <span class="text-xs px-3 py-1.5 rounded-full font-medium" [class]="phaseBadgeClass(tournamentPhase()!)">
                {{ phaseLabel(tournamentPhase()!) }}
              </span>
              @if (tournamentPhase() === 'ENROLLMENT') {
                <button
                  id="btn-manage-poules"
                  (click)="goToPoules()"
                  class="text-sm px-4 py-2 rounded-xl bg-touche-celeste text-touche-navy font-bold hover:bg-touche-celeste/80 transition-colors"
                >
                  Generar Poules
                </button>
              } @else if (tournamentPhase() === 'POULES_IN_PROGRESS' || tournamentPhase() === 'ELIMINATION_IN_PROGRESS') {
                <button
                  id="btn-manage-poules"
                  (click)="goToPoules()"
                  class="text-sm px-4 py-2 rounded-xl bg-touche-celeste text-touche-navy font-bold hover:bg-touche-celeste/80 transition-colors"
                >
                  Gestionar Poules
                </button>
              } @else if (tournamentPhase() === 'FINISHED') {
                <button
                  id="btn-manage-poules"
                  (click)="goToPoules()"
                  class="text-sm px-4 py-2 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-colors"
                >
                  Ver Poules/Bracket
                </button>
                <button
                  id="btn-view-results"
                  (click)="goToResults()"
                  class="text-sm px-4 py-2 rounded-xl bg-touche-gold text-touche-navy font-bold hover:bg-yellow-500 transition-colors"
                >
                  Ver Resultados
                </button>
              }
            </div>
          }
        </div>

        <!-- Filter tabs -->
        <div class="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl w-full max-w-sm">
          @for (tab of filterTabs; track tab.value) {
            <button
              [id]="'tab-' + tab.value"
              (click)="setFilter(tab.value)"
              [class]="activeFilter() === tab.value
                ? 'flex-1 text-sm py-2 px-3 rounded-lg bg-touche-celeste text-touche-navy font-bold transition-all'
                : 'flex-1 text-sm py-2 px-3 rounded-lg text-white/60 hover:text-white transition-all'"
            >
              {{ tab.label }} ({{ countByStatus(tab.value) }})
            </button>
          }
        </div>

        <!-- Loading -->
        @if (loading()) {
          <div class="flex justify-center items-center h-48">
            <div class="animate-spin rounded-full h-10 w-10 border-4 border-touche-celeste border-t-transparent"></div>
          </div>
        }

        <!-- Error -->
        @if (error()) {
          <div class="bg-red-900/30 border border-red-500/50 rounded-xl p-4 text-red-300 mb-4">
            {{ error() }}
          </div>
        }

        <!-- Empty -->
        @if (!loading() && filteredEnrollments().length === 0) {
          <div class="text-center py-16 text-white/40">
            <p class="text-lg">Sin inscriptos en este estado</p>
          </div>
        }

        <!-- List -->
        @if (!loading()) {
          <div class="space-y-4">
            @for (enrollment of filteredEnrollments(); track enrollment.enrollmentId) {
              <div class="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <!-- Athlete header -->
                <div class="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-touche-celeste/20 flex items-center justify-center text-touche-celeste font-bold text-lg flex-shrink-0">
                      {{ enrollment.athlete.firstName.charAt(0) }}{{ enrollment.athlete.lastName.charAt(0) }}
                    </div>
                    <div>
                      <h3 class="font-bold text-white">
                        {{ enrollment.athlete.firstName }} {{ enrollment.athlete.lastName }}
                      </h3>
                      <p class="text-sm text-white/50">DNI: {{ enrollment.athlete.dni }} · {{ enrollment.athlete.club ?? 'Sin club' }}</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-medium px-3 py-1 rounded-full"
                      [class]="statusBadgeClass(enrollment.status)">
                      {{ statusLabel(enrollment.status) }}
                    </span>
                    <span class="text-touche-gold font-bold"><span>$</span>{{ enrollment.amount | number:'1.0-0' }}</span>
                  </div>
                </div>

                <!-- Documents section -->
                @if (enrollment.documents.length > 0) {
                  <div class="border-t border-white/10 px-5 py-4">
                    <h4 class="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Documentación</h4>
                    <div class="space-y-3">
                      @for (doc of enrollment.documents; track doc.documentId) {
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/5 rounded-xl p-3">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                              <svg class="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                              </svg>
                            </div>
                            <div>
                              <p class="text-sm font-medium text-white">{{ docTypeLabel(doc.documentType) }}</p>
                              <span class="text-xs px-2 py-0.5 rounded-full"
                                [class]="validationBadgeClass(doc.validationStatus)">
                                {{ validationLabel(doc.validationStatus) }}
                              </span>
                            </div>
                          </div>
                          <div class="flex items-center gap-2">
                            @if (doc.validationStatus !== 'APPROVED') {
                              <button
                                [id]="'btn-approve-' + doc.documentId"
                                (click)="validateDoc(doc.documentId, 'APPROVED', enrollment)"
                                class="text-xs py-1.5 px-3 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-400 transition-colors font-medium"
                              >
                                Aprobar
                              </button>
                            }
                            @if (doc.validationStatus !== 'REJECTED') {
                              <button
                                [id]="'btn-reject-' + doc.documentId"
                                (click)="rejectDoc(doc.documentId, enrollment)"
                                class="text-xs py-1.5 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors font-medium"
                              >
                                Rechazar
                              </button>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                } @else {
                  <div class="border-t border-white/10 px-5 py-3 text-sm text-white/30 italic">
                    Sin documentos cargados
                  </div>
                }
              </div>
            }
          </div>
        }
        <!-- Referee applications panel -->
        <app-referee-applications [tournamentId]="tournamentId"></app-referee-applications>

      </div>
    </div>
  `
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

  statusLabel = (s: EnrollmentStatus) => EnrollmentStatusLabels[s] ?? s;
  validationLabel = (s: DocumentValidationStatus) => DocumentValidationStatusLabels[s] ?? s;
  docTypeLabel = (t: string) => DocumentTypeLabels[t] ?? t;

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

  readonly phaseLabel = (p: TournamentPhase) => TournamentPhaseLabels[p] ?? p;

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


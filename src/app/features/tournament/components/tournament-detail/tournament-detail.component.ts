import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrganizerTournamentService } from '../../services/organizer-tournament.service';
import {
  EnrollmentDetailResponse,
  EnrollmentStatus,
  DocumentValidationStatus,
  DocumentValidationRequest,
  AthleteDocumentInfo
} from '../../../../core/models/tournament.models';
import { LabelPipe } from '../../../../shared/pipes/label.pipe';
import { DocPreviewModalComponent } from '../../../../shared/components/doc-preview-modal/doc-preview-modal.component';

/**
 * Inscriptos panel — embedded in the tournament hub.
 * Lists the tournament's enrollments and lets the organizer validate documents.
 */
@Component({
  selector: 'app-tournament-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, LabelPipe, DocPreviewModalComponent],
  templateUrl: './tournament-detail.component.html'
})
export class TournamentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly tournamentService = inject(OrganizerTournamentService);

  tournamentId = 0;

  readonly enrollments = signal<EnrollmentDetailResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly expandedEnrollmentId = signal<number | null>(null);

  readonly isPreviewOpen = signal<boolean>(false);
  readonly previewUrl = signal<string>('');
  readonly previewContentType = signal<string>('');
  readonly previewFileName = signal<string>('');
  private rawPreviewUrl: string | null = null;

  readonly filteredEnrollments = computed(() => {
    // Exclude CANCELLED enrollments as requested
    return this.enrollments().filter(e => e.status !== 'CANCELLED');
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.tournamentId = id ? +id : 0;
    this.loadEnrollments();
  }

  loadEnrollments(): void {
    this.loading.set(true);
    this.tournamentService.getEnrollments(this.tournamentId).subscribe({
      next: (data) => { this.enrollments.set(data); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar inscriptos.'); this.loading.set(false); }
    });
  }

  toggleDrawer(id: number): void {
    if (this.expandedEnrollmentId() === id) {
      this.expandedEnrollmentId.set(null);
    } else {
      this.expandedEnrollmentId.set(id);
    }
  }

  isDrawerOpen(id: number): boolean {
    return this.expandedEnrollmentId() === id;
  }

  docsSummaryClass(enrollment: EnrollmentDetailResponse): string {
    if (enrollment.documents.length === 0) return 'badge-neutral';
    if (enrollment.documents.some(d => d.validationStatus === 'REJECTED')) return 'badge-danger';
    if (enrollment.documents.some(d => d.validationStatus === 'PENDING')) return 'badge-warning';
    return 'badge-success';
  }

  docsSummaryLabel(enrollment: EnrollmentDetailResponse): string {
    if (enrollment.documents.length === 0) return 'Sin docs';
    if (enrollment.documents.some(d => d.validationStatus === 'REJECTED')) return 'Rechazado';
    if (enrollment.documents.some(d => d.validationStatus === 'PENDING')) return 'Pendiente';
    return 'Aprobado';
  }

  viewDocument(athleteId: number, doc: AthleteDocumentInfo): void {
    this.tournamentService.downloadAthleteDocument(athleteId, doc.documentId).subscribe({
      next: (blob) => {
        if (this.rawPreviewUrl) {
          window.URL.revokeObjectURL(this.rawPreviewUrl);
        }
        const url = window.URL.createObjectURL(blob);
        this.rawPreviewUrl = url;
        
        this.previewUrl.set(url);
        this.previewContentType.set(blob.type || 'application/pdf');
        
        const typeLabel = doc.documentType === 'MEDICAL_CLEARANCE' ? 'Apto Medico' : 'Comprobante de Pago';
        const extension = blob.type.includes('png') ? '.png' : blob.type.includes('jpeg') || blob.type.includes('jpg') ? '.jpg' : '.pdf';
        this.previewFileName.set(`${typeLabel}${extension}`);
        
        this.isPreviewOpen.set(true);
      },
      error: () => {
        alert('No se pudo descargar o abrir el documento.');
      }
    });
  }

  closePreview(): void {
    if (this.rawPreviewUrl) {
      window.URL.revokeObjectURL(this.rawPreviewUrl);
      this.rawPreviewUrl = null;
    }
    this.previewUrl.set('');
    this.previewContentType.set('');
    this.previewFileName.set('');
    this.isPreviewOpen.set(false);
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

  statusBadgeClass(status: EnrollmentStatus): string {
    const map: Record<EnrollmentStatus, string> = {
      PAID: 'badge-success',
      PENDING_PAYMENT: 'badge-warning',
      CANCELLED: 'badge-danger'
    };
    return map[status] ?? 'badge-neutral';
  }

  validationBadgeClass(status: DocumentValidationStatus): string {
    const map: Record<DocumentValidationStatus, string> = {
      PENDING: 'badge-warning',
      APPROVED: 'badge-success',
      REJECTED: 'badge-danger'
    };
    return map[status] ?? 'badge-neutral';
  }
}

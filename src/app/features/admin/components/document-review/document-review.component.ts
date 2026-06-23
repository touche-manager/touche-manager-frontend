import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AdminPendingDocumentResponse } from '../../../../core/models/admin.models';

@Component({
  selector: 'app-admin-document-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './document-review.component.html'
})
export class DocumentReviewComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly documents = signal<AdminPendingDocumentResponse[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly successMsg = signal<string | null>(null);
  readonly notes = signal<Record<number, string>>({});
  readonly validatingId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.loading.set(true);
    this.adminService.getPendingDocuments().subscribe({
      next: (docs) => { this.documents.set(docs); this.loading.set(false); },
      error: () => { this.error.set('Error al cargar los documentos pendientes.'); this.loading.set(false); }
    });
  }

  setNotes(documentId: number, value: string): void {
    this.notes.update(m => ({ ...m, [documentId]: value }));
  }

  validate(doc: AdminPendingDocumentResponse, status: 'APPROVED' | 'REJECTED'): void {
    const reviewNotes = (this.notes()[doc.documentId] ?? '').trim();
    if (status === 'REJECTED' && !reviewNotes) {
      this.error.set('Para rechazar un documento debés indicar el motivo en las notas.');
      return;
    }

    this.validatingId.set(doc.documentId);
    this.error.set(null);
    this.adminService.validateDocument(doc.documentId, {
      validationStatus: status,
      reviewNotes: reviewNotes || undefined
    }).subscribe({
      next: () => {
        this.documents.update(list => list.filter(d => d.documentId !== doc.documentId));
        this.validatingId.set(null);
        this.showSuccess(status === 'APPROVED'
          ? `Documento de ${doc.athleteName} aprobado.`
          : `Documento de ${doc.athleteName} rechazado.`);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'No se pudo validar el documento.');
        this.validatingId.set(null);
      }
    });
  }

  private showSuccess(msg: string): void {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(null), 3000);
  }
}

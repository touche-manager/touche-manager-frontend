import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AdminPendingDocumentResponse } from '../../../../core/models/admin.models';

@Component({
  selector: 'app-admin-document-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">

      @if (error()) {
        <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-touche-alert font-semibold">
          {{ error() }}
        </div>
      }

      @if (successMsg()) {
        <div class="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-700 font-semibold">
          {{ successMsg() }}
        </div>
      }

      @if (loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-10 w-10 border-4 border-touche-celeste border-t-transparent"></div>
        </div>
      }

      @if (!loading() && documents().length === 0) {
        <div class="card text-center py-12">
          <p class="text-sm font-bold text-slate-400">No hay documentos pendientes</p>
          <p class="text-xs text-slate-400 mt-1">Todos los documentos del sistema están revisados. 🎉</p>
        </div>
      }

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (doc of documents(); track doc.documentId) {
          <div class="card p-5 space-y-3">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="font-bold text-touche-navy truncate">{{ doc.athleteName }}</p>
                <p class="text-xs text-slate-400 mt-0.5">
                  DNI {{ doc.dni }}@if (doc.club) { · {{ doc.club }} }
                </p>
              </div>
              <span class="badge flex-shrink-0"
                    [ngClass]="doc.documentType === 'MEDICAL_CLEARANCE'
                      ? 'bg-touche-celeste/12 text-touche-navy'
                      : 'bg-touche-gold/12 text-touche-navy'">
                {{ doc.documentType === 'MEDICAL_CLEARANCE' ? 'Apto Médico' : 'Comprobante' }}
              </span>
            </div>

            <p class="text-xs text-slate-400">Subido el {{ doc.uploadDate | date:'dd/MM/yyyy HH:mm' }}</p>
            @if (doc.description) {
              <p class="text-xs text-slate-500 italic">"{{ doc.description }}"</p>
            }

            <textarea
              [id]="'notes-' + doc.documentId"
              [ngModel]="notes()[doc.documentId] || ''"
              (ngModelChange)="setNotes(doc.documentId, $event)"
              rows="2"
              placeholder="Notas de revisión (opcional, requerido al rechazar)..."
              class="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 text-touche-navy
                     placeholder-slate-400 focus:outline-none focus:border-touche-celeste transition-colors resize-none"
            ></textarea>

            <div class="flex gap-2">
              <button
                [id]="'btn-approve-' + doc.documentId"
                (click)="validate(doc, 'APPROVED')"
                [disabled]="validatingId() === doc.documentId"
                class="flex-1 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm
                       font-bold transition-colors border border-emerald-200 disabled:opacity-40"
              >
                ✓ Aprobar
              </button>
              <button
                [id]="'btn-reject-' + doc.documentId"
                (click)="validate(doc, 'REJECTED')"
                [disabled]="validatingId() === doc.documentId"
                class="flex-1 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-touche-alert text-sm
                       font-bold transition-colors border border-red-200 disabled:opacity-40"
              >
                ✕ Rechazar
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
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

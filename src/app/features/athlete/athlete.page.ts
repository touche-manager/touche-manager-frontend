import { Component, OnDestroy, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AthleteService } from './services/athlete.service';
import { AthleteRequest, AthleteDocumentResponse, DocumentTypeLabels } from '../../core/models/athlete.models';

import { DocPreviewModalComponent } from '../../shared/components/doc-preview-modal/doc-preview-modal.component';
import { NotificationService } from '../../shared/services/notification.service';
import { AlertService } from '../../shared/services/alert.service';

@Component({
  selector: 'app-athlete-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, DocPreviewModalComponent],
  templateUrl: './athlete.page.html',
  styleUrl: './athlete.page.css'
})
export class AthletePageComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly athleteService = inject(AthleteService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly route = inject(ActivatedRoute);
  private readonly notificationService = inject(NotificationService);
  private readonly alertService = inject(AlertService);
  private notifSub: Subscription | null = null;

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  /** True while the athlete is enrolled in an unfinished tournament → profile read-only */
  readonly profileLocked = signal<boolean>(false);

  // Tabs management
  readonly activeTab = signal<'profile' | 'documents'>('profile');

  // Documents state
  readonly documents = signal<AthleteDocumentResponse[]>([]);
  readonly loadingDocuments = signal<boolean>(false);
  readonly documentError = signal<string | null>(null);
  readonly documentSuccess = signal<boolean>(false);
  readonly uploading = signal<boolean>(false);
  readonly documentTypeLabels = DocumentTypeLabels;

  /** Documents with status REJECTED — used to show the alert banner */
  readonly rejectedDocuments = computed(() =>
    this.documents().filter(d => d.validationStatus === 'REJECTED')
  );

  // Integrated Preview state
  readonly previewUrl = signal<SafeResourceUrl | null>(null);
  readonly previewType = signal<'pdf' | 'image' | 'unsupported' | null>(null);
  readonly previewFileName = signal<string>('');
  readonly isPreviewOpen = signal<boolean>(false);
  readonly previewContentType = signal<string>('');
  readonly rawPreviewUrlSig = signal<string>('');
  private rawPreviewUrl: string | null = null;

  athleteForm!: FormGroup;
  uploadForm!: FormGroup;
  selectedFile: File | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadProfile();
    // Read ?tab= query param (e.g. from notification navigation arrow)
    const tabParam = this.route.snapshot.queryParamMap.get('tab') as 'profile' | 'documents' | null;
    if (tabParam && ['profile', 'documents'].includes(tabParam)) {
      this.activeTab.set(tabParam);
    }
    // Reload documents if a DOCUMENT_REJECTED notification arrives
    this.notifSub = this.notificationService.newNotification$.subscribe(n => {
      if (n.type === 'DOCUMENT_REJECTED') {
        this.loadDocuments();
      }
    });
  }

  ngOnDestroy(): void {
    this.notifSub?.unsubscribe();
  }

  private initForm(): void {
    this.athleteForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      dni: ['', [Validators.required, Validators.pattern(/^[0-9]{7,10}$/)]],
      birthDate: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      dominantHand: ['', [Validators.required]],
      club: ['', [Validators.required]],
      province: ['', [Validators.required]]
    });

    this.uploadForm = this.fb.group({
      documentType: ['', [Validators.required]],
      description: ['', [Validators.maxLength(200)]]
    });
  }

  private loadProfile(): void {
    this.loading.set(true);
    this.error.set(null);

    this.athleteService.getProfile().subscribe({
      next: (profile) => {
        this.isEditMode.set(true);
        this.athleteForm.patchValue(profile);
        // Lock editing while enrolled in an unfinished tournament
        this.profileLocked.set(!profile.canEditProfile);
        if (!profile.canEditProfile) {
          this.athleteForm.disable();
        } else {
          this.athleteForm.enable();
        }
        this.loading.set(false);
        // Load documents if in edit mode
        this.loadDocuments();
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        if (err.status === 404) {
          // Profile not found - this is expected if user hasn't created one yet
          this.isEditMode.set(false);
        } else {
          this.error.set(err.error?.message || 'Error al cargar el perfil de atleta.');
        }
      }
    });
  }

  onSubmit(): void {
    if (this.profileLocked()) return;
    if (this.athleteForm.invalid) {
      this.athleteForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    const requestData: AthleteRequest = this.athleteForm.value;

    const request$ = this.isEditMode()
      ? this.athleteService.updateProfile(requestData)
      : this.athleteService.createProfile(requestData);

    request$.subscribe({
      next: (profile) => {
        this.success.set(true);
        this.isEditMode.set(true);
        this.athleteForm.patchValue(profile);
        this.loading.set(false);
        this.loadDocuments();
        // Clear success message after 5 seconds
        setTimeout(() => this.success.set(false), 5000);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Ocurrió un error al guardar el perfil.');
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.athleteForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────

  setTab(tab: 'profile' | 'documents'): void {
    this.activeTab.set(tab);
    if (tab === 'documents') {
      this.loadDocuments();
    }
  }

  // ── Documents Logic ────────────────────────────────────────────────────────

  loadDocuments(): void {
    if (!this.isEditMode()) return;

    this.loadingDocuments.set(true);
    this.documentError.set(null);

    this.athleteService.getDocuments().subscribe({
      next: (docs) => {
        this.documents.set(docs);
        this.loadingDocuments.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingDocuments.set(false);
        this.documentError.set(err.error?.message || 'Error al cargar los documentos.');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
    } else {
      this.selectedFile = null;
    }
  }

  onUploadDocument(): void {
    if (this.uploadForm.invalid || !this.selectedFile) {
      this.uploadForm.markAllAsTouched();
      return;
    }

    this.uploading.set(true);
    this.documentError.set(null);
    this.documentSuccess.set(false);

    const type = this.uploadForm.value.documentType;
    const desc = this.uploadForm.value.description;

    this.athleteService.uploadDocument(this.selectedFile, type, desc).subscribe({
      next: (newDoc) => {
        this.documents.update(docs => [...docs, newDoc]);
        this.documentSuccess.set(true);
        this.uploading.set(false);
        this.selectedFile = null;
        this.uploadForm.reset({ documentType: '', description: '' });

        // Reset file input in HTML
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        setTimeout(() => this.documentSuccess.set(false), 5000);
      },
      error: (err: HttpErrorResponse) => {
        this.uploading.set(false);
        this.documentError.set(err.error?.message || 'Error al subir el documento.');
      }
    });
  }

  onPreviewDocument(doc: AthleteDocumentResponse): void {
    this.documentError.set(null);

    this.athleteService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        // Clean up previous preview URL to avoid leaks
        if (this.rawPreviewUrl) {
          window.URL.revokeObjectURL(this.rawPreviewUrl);
        }

        const contentType = doc.contentType.toLowerCase();
        const url = window.URL.createObjectURL(blob);
        this.rawPreviewUrl = url;
        
        this.rawPreviewUrlSig.set(url);
        this.previewContentType.set(contentType);

        // Compute preview/download filename dynamically
        const typeLabel = this.documentTypeLabels[doc.documentType];
        const year = new Date(doc.uploadDate).getFullYear();
        let extension = '';
        if (contentType.includes('pdf')) {
          extension = '.pdf';
        } else if (contentType.includes('png')) {
          extension = '.png';
        } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
          extension = '.jpg';
        }
        this.previewFileName.set(`${typeLabel} ${year}${extension}`);

        this.isPreviewOpen.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.documentError.set('Error al descargar el archivo para previsualización.');
      }
    });
  }

  closePreview(): void {
    if (this.rawPreviewUrl) {
      window.URL.revokeObjectURL(this.rawPreviewUrl);
      this.rawPreviewUrl = null;
    }
    this.rawPreviewUrlSig.set('');
    this.previewContentType.set('');
    this.previewFileName.set('');
    this.isPreviewOpen.set(false);
  }

  downloadCurrentFile(): void {
    if (!this.rawPreviewUrl) return;
    
    const a = document.createElement('a');
    a.href = this.rawPreviewUrl;
    a.download = this.previewFileName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async onDeleteDocument(docId: number): Promise<void> {
    const confirmed = await this.alertService.confirm('Eliminar documento', '¿Estás seguro de que deseas eliminar este documento?', true);
    if (!confirmed) return;

    this.documentError.set(null);

    this.athleteService.deleteDocument(docId).subscribe({
      next: () => {
        this.documents.update(docs => docs.filter(d => d.id !== docId));
      },
      error: (err: HttpErrorResponse) => {
        this.documentError.set(err.error?.message || 'Error al eliminar el documento.');
      }
    });
  }
}

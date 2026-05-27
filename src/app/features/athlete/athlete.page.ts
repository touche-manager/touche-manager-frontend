import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { AthleteService } from './services/athlete.service';
import { AthleteRequest, AthleteDocumentResponse, DocumentTypeLabels } from '../../core/models/athlete.models';

@Component({
  selector: 'app-athlete-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './athlete.page.html',
  styleUrl: './athlete.page.css'
})
export class AthletePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly athleteService = inject(AthleteService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);

  // Tabs management
  readonly activeTab = signal<'profile' | 'documents'>('profile');

  // Documents state
  readonly documents = signal<AthleteDocumentResponse[]>([]);
  readonly loadingDocuments = signal<boolean>(false);
  readonly documentError = signal<string | null>(null);
  readonly documentSuccess = signal<boolean>(false);
  readonly uploading = signal<boolean>(false);
  readonly documentTypeLabels = DocumentTypeLabels;

  // Integrated Preview state
  readonly previewUrl = signal<SafeResourceUrl | null>(null);
  readonly previewType = signal<'pdf' | 'image' | 'unsupported' | null>(null);
  readonly previewFileName = signal<string>('');
  readonly isPreviewOpen = signal<boolean>(false);
  private rawPreviewUrl: string | null = null;

  athleteForm!: FormGroup;
  uploadForm!: FormGroup;
  selectedFile: File | null = null;

  ngOnInit(): void {
    this.initForm();
    this.loadProfile();
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

        // Determine preview type based on contentType
        const contentType = doc.contentType.toLowerCase();
        if (contentType.includes('pdf')) {
          this.previewType.set('pdf');
        } else if (contentType.includes('image') || contentType.includes('png') || contentType.includes('jpg') || contentType.includes('jpeg')) {
          this.previewType.set('image');
        } else {
          this.previewType.set('unsupported');
        }

        const url = window.URL.createObjectURL(blob);
        this.rawPreviewUrl = url;
        
        // Sanitize the URL for Angular binding
        this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
        this.previewFileName.set(doc.fileName);
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
    this.previewUrl.set(null);
    this.previewType.set(null);
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

  onDeleteDocument(docId: number): void {
    if (!confirm('¿Estás seguro de que deseas eliminar este documento?')) return;

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

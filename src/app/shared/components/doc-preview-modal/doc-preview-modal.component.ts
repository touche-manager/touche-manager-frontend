import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-doc-preview-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './doc-preview-modal.component.html',
  styleUrls: ['./doc-preview-modal.component.css']
})
export class DocPreviewModalComponent {
  private readonly sanitizer = inject(DomSanitizer);

  private _rawUrl = '';
  private _contentType = '';

  @Input() fileName = '';

  @Input() set rawUrl(value: string) {
    this._rawUrl = value;
    this.updatePreview();
  }
  get rawUrl(): string {
    return this._rawUrl;
  }

  @Input() set contentType(value: string) {
    this._contentType = value;
    this.updatePreview();
  }
  get contentType(): string {
    return this._contentType;
  }

  @Output() close = new EventEmitter<void>();

  readonly previewUrl = signal<SafeResourceUrl | null>(null);
  readonly previewType = signal<'pdf' | 'image' | 'unsupported'>('unsupported');

  private updatePreview(): void {
    if (!this._rawUrl || !this._contentType) return;
    
    // Sanitize URL
    this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this._rawUrl));

    // Determine type
    const ct = this._contentType.toLowerCase();
    if (ct.includes('pdf')) {
      this.previewType.set('pdf');
    } else if (
      ct.includes('image') ||
      ct.includes('png') ||
      ct.includes('jpg') ||
      ct.includes('jpeg')
    ) {
      this.previewType.set('image');
    } else {
      this.previewType.set('unsupported');
    }
  }

  download(): void {
    if (!this._rawUrl) return;
    const a = document.createElement('a');
    a.href = this._rawUrl;
    a.download = this.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

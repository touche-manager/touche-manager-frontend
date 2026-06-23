import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-alert-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alert-modal.component.html'
})
export class AlertModalComponent {
  private readonly alertService = inject(AlertService);

  readonly alert = this.alertService.currentAlert;

  onConfirm(): void {
    this.alertService.close(true);
  }

  onCancel(): void {
    const activeAlert = this.alert();
    // Only resolve as false if it was actually a cancelable modal (has close/cancel action)
    if (activeAlert?.showCancel) {
      this.alertService.close(false);
    } else {
      this.alertService.close(true);
    }
  }

  getGlowClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-emerald-500';
      case 'info':    return 'bg-touche-celeste';
      case 'warning': return 'bg-touche-gold';
      case 'error':   return 'bg-touche-alert';
      default:        return 'bg-touche-navy';
    }
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'info':
        return 'bg-touche-celeste/10 text-touche-navy border-touche-celeste/20';
      case 'warning':
        return 'bg-touche-gold/10 text-touche-gold border-touche-gold/20';
      case 'error':
        return 'bg-red-50 text-touche-alert border-red-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  }
}

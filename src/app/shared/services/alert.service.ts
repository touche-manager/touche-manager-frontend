import { Injectable, signal } from '@angular/core';
import { AlertOptions } from '../../core/models/alert.models';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  readonly currentAlert = signal<AlertOptions | null>(null);
  private resolveFn: ((value: boolean) => void) | null = null;

  /**
   * Shows a custom alert modal and returns a Promise that resolves to true (confirmed) or false (cancelled).
   */
  show(options: AlertOptions): Promise<boolean> {
    // If an alert is already visible, resolve it immediately to avoid locks
    if (this.resolveFn) {
      this.close(false);
    }
    this.currentAlert.set(options);
    return new Promise<boolean>((resolve) => {
      this.resolveFn = resolve;
    });
  }

  /**
   * Helper method to show a standard confirmation modal (Warning style, Yes/No buttons).
   */
  confirm(title: string, message: string, isDestructive = false): Promise<boolean> {
    return this.show({
      title,
      message,
      type: 'warning',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      showCancel: true,
      isDestructive
    });
  }

  /**
   * Helper method to show a success feedback alert modal.
   */
  success(title: string, message: string): Promise<boolean> {
    return this.show({
      title,
      message,
      type: 'success',
      confirmText: 'Aceptar'
    });
  }

  /**
   * Helper method to show an informational message modal.
   */
  info(title: string, message: string): Promise<boolean> {
    return this.show({
      title,
      message,
      type: 'info',
      confirmText: 'Aceptar'
    });
  }

  /**
   * Helper method to show an error message modal.
   */
  error(title: string, message: string): Promise<boolean> {
    return this.show({
      title,
      message,
      type: 'error',
      confirmText: 'Aceptar'
    });
  }

  /**
   * Closes the active alert and resolves the pending promise with the given result.
   */
  close(result: boolean): void {
    this.currentAlert.set(null);
    if (this.resolveFn) {
      this.resolveFn(result);
      this.resolveFn = null;
    }
  }
}

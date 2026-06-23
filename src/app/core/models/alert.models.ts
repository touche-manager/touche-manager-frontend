export type AlertType = 'success' | 'info' | 'warning' | 'error';

export interface AlertOptions {
  title: string;
  message: string;
  type: AlertType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  isDestructive?: boolean;
}

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  private readonly http = inject(HttpClient);
  private messaging: Messaging | null = null;
  private currentToken: string | null = null;

  /**
   * Initializes Firebase, requests notification permission, gets the FCM token
   * and registers it in the backend. Call once after authentication.
   * Gracefully no-ops if Firebase is not configured or browser lacks support.
   */
  async requestPermissionAndRegister(): Promise<void> {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      console.warn('[FCM] Push notifications not supported in this browser.');
      return;
    }

    // Skip if Firebase not configured (empty projectId = placeholder)
    if (!environment.firebase?.projectId) {
      console.info('[FCM] Firebase not configured — skipping push setup.');
      return;
    }

    try {
      const app: FirebaseApp = getApps().length === 0
        ? initializeApp(environment.firebase)
        : getApps()[0];

      this.messaging = getMessaging(app);

      // Register SW and send config to it for background messages
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope'
      });

      // Wait for SW to be ready, then send config
      navigator.serviceWorker.ready.then((reg) => {
        reg.active?.postMessage({
          type: 'FIREBASE_CONFIG',
          config: {
            apiKey: environment.firebase.apiKey,
            authDomain: environment.firebase.authDomain,
            projectId: environment.firebase.projectId,
            storageBucket: environment.firebase.storageBucket,
            messagingSenderId: environment.firebase.messagingSenderId,
            appId: environment.firebase.appId
          }
        });
      });

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.info('[FCM] Notification permission denied.');
        return;
      }

      const token = await getToken(this.messaging, {
        vapidKey: environment.firebase.vapidKey,
        serviceWorkerRegistration: registration
      });

      if (!token) {
        console.warn('[FCM] Could not obtain FCM token.');
        return;
      }

      this.currentToken = token;

      // Register token in backend
      this.http.post(`${environment.apiUrl}/notifications/fcm-token`, { token })
        .subscribe({
          next: () => console.info('[FCM] Token registered in backend.'),
          error: (err) => console.warn('[FCM] Could not register token in backend:', err)
        });

      // Listen for foreground messages and forward to NotificationBell
      onMessage(this.messaging, (payload) => {
        console.info('[FCM] Foreground message:', payload);
        window.dispatchEvent(new CustomEvent('fcm-foreground-message', { detail: payload }));
      });

    } catch (error) {
      console.error('[FCM] Setup error:', error);
    }
  }

  /** Removes the FCM token from backend on logout */
  unregister(): void {
    if (!this.currentToken) return;
    const token = this.currentToken;
    this.currentToken = null;
    this.http.delete(`${environment.apiUrl}/notifications/fcm-token`, { body: { token } })
      .subscribe({
        error: (err) => console.warn('[FCM] Could not unregister token:', err)
      });
  }
}

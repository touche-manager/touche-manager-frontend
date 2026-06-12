export type NotificationType = 'UPCOMING_BOUT';

export interface NotificationDTO {
  id: number;
  tournamentId: number | null;
  boutId: number | null;
  type: NotificationType;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface NotifyUpcomingBoutRequest {
  minutesAhead: number;
  piste?: string;
}

// ── Live scoreboard (SSE) ─────────────────────────────────────────────────────

export interface BoutLiveUpdate {
  boutId: number;
  scoreLeft: number;
  scoreRight: number;
  leftName: string;
  rightName: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
  elapsedSeconds: number;
  period: number;
  piste: string | null;
  winnerName: string | null;
}

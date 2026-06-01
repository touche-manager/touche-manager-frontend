// ── Enums ─────────────────────────────────────────────────────────────────────

export type BoutFormat = 'POULE' | 'ELIMINATION';
export type BoutStatus = 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
export type EventSide = 'LEFT' | 'RIGHT';
export type EventType = 'TOUCHE' | 'PENALTY' | 'CARD';

// ── Requests ──────────────────────────────────────────────────────────────────

export interface BoutRequest {
  tournamentId: number;
  athleteLeftId: number;
  athleteRightId: number;
  format: BoutFormat;
}

export interface BoutEventRequest {
  side: EventSide;
  eventType: EventType;
}

export interface ElapsedTimeRequest {
  elapsedSeconds: number;
}

// ── Responses ─────────────────────────────────────────────────────────────────

export interface AthleteSummary {
  id: number;
  firstName: string;
  lastName: string;
  club: string | null;
}

export interface BoutEventResponse {
  id: number;
  side: EventSide;
  eventType: EventType;
  scoreDelta: number;
  recordedAt: string;
}

export interface BoutResponse {
  id: number;
  tournamentId: number;
  tournamentName: string;
  format: BoutFormat;
  status: BoutStatus;
  athleteLeft: AthleteSummary;
  athleteRight: AthleteSummary;
  scoreLeft: number;
  scoreRight: number;
  currentPeriod: number;
  maxPeriods: number;
  touchesTarget: number;
  elapsedSeconds: number;
  winnerId: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  events: BoutEventResponse[];
}

export interface AthleteStanding {
  rank: number;
  athleteId: number;
  firstName: string;
  lastName: string;
  club: string | null;
  bouts: number;
  victories: number;
  defeats: number;
  touchesScored: number;
  touchesReceived: number;
  indicator: number;
}

export interface TournamentStandingsResponse {
  tournamentId: number;
  tournamentName: string;
  standings: AthleteStanding[];
}

// ── Display Labels ─────────────────────────────────────────────────────────────

export const BoutFormatLabels: Record<BoutFormat, string> = {
  POULE: 'Poule (5 toques, 3 min)',
  ELIMINATION: 'Eliminación (15 toques, 3×3 min)'
};

export const BoutStatusLabels: Record<BoutStatus, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En Curso',
  FINISHED: 'Finalizado'
};

export const EventTypeLabels: Record<EventType, string> = {
  TOUCHE: 'Touché',
  PENALTY: 'Penalidad',
  CARD: 'Tarjeta'
};

export type Weapon = 'FOIL' | 'EPEE' | 'SABRE';

export type TournamentCategory =
  | 'PRE_INFANTILE'
  | 'INFANTILE'
  | 'PRE_CADET'
  | 'CADET'
  | 'JUNIOR'
  | 'SENIOR'
  | 'VETERAN';

export type TournamentGender = 'MALE' | 'FEMALE';

export type EnrollmentStatus = 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED';

export type TournamentEnrollmentPhase = 'OPEN_REGULAR' | 'OPEN_LATE' | 'CLOSED';

export interface TournamentResponse {
  id: number;
  name: string;
  weapon: Weapon;
  category: TournamentCategory;
  gender: TournamentGender;
  location: string;
  date: string; // LocalDate as YYYY-MM-DD string
  basePrice: number;
  regularDeadline: string; // YYYY-MM-DD
  lateDeadline: string; // YYYY-MM-DD
  currentPrice: number;
  enrollmentStatus: TournamentEnrollmentPhase;
  alreadyEnrolled: boolean;
  enrollmentStatusLabel?: EnrollmentStatus | null;
  enrollmentId?: number | null;
  wasPreviouslyPaid: boolean;
}

export interface EnrollmentRequest {
  tournamentId: number;
}

export interface EnrollmentResponse {
  id: number;
  athleteId: number;
  tournamentId: number;
  tournamentName: string;
  amount: number;
  status: EnrollmentStatus;
  paymentLink: string;
}

// ── Spanish Display Label Mappings ───────────────────────────────────────────

export const WeaponLabels: Record<Weapon, string> = {
  FOIL: 'Florete',
  EPEE: 'Espada',
  SABRE: 'Sable'
};

export const CategoryLabels: Record<TournamentCategory, string> = {
  PRE_INFANTILE: 'Pre-Infantiles',
  INFANTILE: 'Infantiles',
  PRE_CADET: 'Pre-Cadetes',
  CADET: 'Cadetes',
  JUNIOR: 'Juveniles',
  SENIOR: 'Mayores',
  VETERAN: 'Veteranos'
};

export const GenderLabels: Record<TournamentGender, string> = {
  MALE: 'Masculino',
  FEMALE: 'Femenino'
};

export const EnrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  PENDING_PAYMENT: 'Pendiente de Pago',
  PAID: 'Inscripto',
  CANCELLED: 'Cancelado'
};

// ── Organizer Types ───────────────────────────────────────────────────────────

export type DocumentValidationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface TournamentRequest {
  name: string;
  weapon: Weapon;
  category: TournamentCategory;
  gender: TournamentGender;
  location: string;
  date: string; // YYYY-MM-DD
  basePrice: number;
}

export interface OrganizerTournamentResponse {
  id: number;
  name: string;
  weapon: Weapon;
  category: TournamentCategory;
  gender: TournamentGender;
  location: string;
  date: string;
  basePrice: number;
  phase?: TournamentPhase;
  advancementRate?: number;
  totalEnrollments: number;
  paidEnrollments: number;
  pendingEnrollments: number;
  cancelledEnrollments: number;
}

export interface AthleteDocumentInfo {
  documentId: number;
  documentType: 'MEDICAL_CLEARANCE' | 'PAYMENT_RECEIPT';
  fileKey: string;
  validationStatus: DocumentValidationStatus;
  reviewNotes: string | null;
  uploadDate: string;
}

export interface EnrollmentAthleteInfo {
  id: number;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  club: string | null;
  province: string | null;
}

export interface EnrollmentDetailResponse {
  enrollmentId: number;
  status: EnrollmentStatus;
  amount: number;
  enrollmentDate: string;
  athlete: EnrollmentAthleteInfo;
  documents: AthleteDocumentInfo[];
}

export interface DocumentValidationRequest {
  validationStatus: DocumentValidationStatus;
  reviewNotes?: string;
}

export const DocumentValidationStatusLabels: Record<DocumentValidationStatus, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado'
};

export const DocumentTypeLabels: Record<string, string> = {
  MEDICAL_CLEARANCE: 'Apto Médico',
  PAYMENT_RECEIPT: 'Comprobante de Afiliación'
};

// ── Tournament Phases ─────────────────────────────────────────────────────────

export type TournamentPhase =
  | 'ENROLLMENT'
  | 'POULES_IN_PROGRESS'
  | 'ELIMINATION_IN_PROGRESS'
  | 'FINISHED';

export const TournamentPhaseLabels: Record<TournamentPhase, string> = {
  ENROLLMENT: 'Inscripciones',
  POULES_IN_PROGRESS: 'Poules en Curso',
  ELIMINATION_IN_PROGRESS: 'Eliminatorias en Curso',
  FINISHED: 'Finalizado'
};

// ── Poules ────────────────────────────────────────────────────────────────────

export type PouleStatus = 'PENDING' | 'IN_PROGRESS' | 'FINISHED';

export interface PouleAthleteInfo {
  id: number;
  fullName: string;
  club: string | null;
}

export interface PouleRefereeInfo {
  userId: number;
  fullName: string;
  email: string;
}

export interface PouleResponse {
  id: number;
  tournamentId: number;
  tournamentName: string;
  number: number;
  status: PouleStatus;
  athletes: PouleAthleteInfo[];
  referees: PouleRefereeInfo[];
  bouts: BoutResponse[];
  totalBouts: number;
  finishedBouts: number;
}

// ── Bouts (extended) ─────────────────────────────────────────────────────────

export type EliminationRound =
  | 'ROUND_OF_64'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTERFINAL'
  | 'SEMIFINAL'
  | 'FINAL';

export const EliminationRoundLabels: Record<EliminationRound, string> = {
  ROUND_OF_64: '64avos',
  ROUND_OF_32: '32avos',
  ROUND_OF_16: '16avos',
  QUARTERFINAL: 'Cuartos de Final',
  SEMIFINAL: 'Semifinales',
  FINAL: 'Final'
};

export interface BoutAthleteInfo {
  id: number;
  firstName: string;
  lastName: string;
  club: string | null;
}

export interface BoutResponse {
  id: number;
  tournamentId: number;
  pouleId: number | null;
  pouleNumber: number | null;
  boutOrder: number | null;
  athleteLeft: BoutAthleteInfo;
  athleteRight: BoutAthleteInfo | null; // null = BYE
  format: 'POULE' | 'ELIMINATION';
  scoreLeft: number;
  scoreRight: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
  currentPeriod: number;
  elapsedSeconds: number;
  winnerId: number | null;
  eliminationRound: EliminationRound | null;
  bracketPosition: number | null;
  referees: PouleRefereeInfo[];
  priority: 'LEFT' | 'RIGHT' | null;
  startedAt: string | null;
  finishedAt: string | null;
  events: any[];
}

// ── Elimination Bracket ───────────────────────────────────────────────────────

export interface PouleStandingEntry {
  athleteId: number;
  fullName: string;
  club: string | null;
  pouleNumber: number;
  victories: number;
  touchesScored: number;
  touchesReceived: number;
  indicator: number;
}

export interface EliminationBracketResponse {
  tournamentId: number;
  tournamentName: string;
  tableauSize: number;
  roundBouts: Partial<Record<EliminationRound, BoutResponse[]>>;
}

// ── Referee Applications ──────────────────────────────────────────────────────

export type RefereeApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export const RefereeApplicationStatusLabels: Record<RefereeApplicationStatus, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado'
};

export interface RefereeApplicationResponse {
  id: number;
  tournamentId: number;
  tournamentName: string;
  refereeId: number;
  refereeName: string;
  refereeEmail: string;
  status: RefereeApplicationStatus;
  appliedAt: string;
  reviewedAt: string | null;
}

// ── Updated OrganizerTournamentResponse (with phase) ─────────────────────────
// Re-export extended version — replace the interface above when backend is updated

export interface OrganizerTournamentResponseV2 extends OrganizerTournamentResponse {
  phase: TournamentPhase;
  advancementRate: number;
}

// ── Tournament Results (public) ───────────────────────────────────────────────

export interface PodiumEntry {
  rank: number;
  athleteId: number;
  fullName: string;
  club: string | null;
}

export interface FinalStanding {
  rank: number;
  athleteId: number;
  fullName: string;
  club: string | null;
  bouts: number;
  victories: number;
  defeats: number;
  touchesScored: number;
  touchesReceived: number;
  indicator: number;
}

export interface TournamentResultResponse {
  tournamentId: number;
  name: string;
  weapon: string;
  category: string;
  gender: string;
  location: string;
  date: string;
  phase: string;
  podium: PodiumEntry[];
  standings: FinalStanding[];
}

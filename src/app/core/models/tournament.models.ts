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

// ── Spanish Display Label Mappings (re-exported from shared for backward compat) ─
export {
  WEAPON_LABELS    as WeaponLabels,
  CATEGORY_LABELS  as CategoryLabels,
  GENDER_LABELS    as GenderLabels,
} from '../../shared/utils/label.maps';

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
  isNational?: boolean;
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
  isNational?: boolean;
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

export {
  DOCUMENT_VALIDATION_STATUS_LABELS as DocumentValidationStatusLabels,
  DOCUMENT_TYPE_LABELS              as DocumentTypeLabels,
  ENROLLMENT_STATUS_LABELS          as EnrollmentStatusLabels,
} from '../../shared/utils/label.maps';

// ── Tournament Phases ─────────────────────────────────────────────────────────

export type TournamentPhase =
  | 'ENROLLMENT'
  | 'POULES_IN_PROGRESS'
  | 'ELIMINATION_IN_PROGRESS'
  | 'FINISHED';

export {
  TOURNAMENT_PHASE_LABELS as TournamentPhaseLabels,
} from '../../shared/utils/label.maps';

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

export {
  ELIMINATION_ROUND_LABELS as EliminationRoundLabels,
} from '../../shared/utils/label.maps';

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
  piste: string | null;
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

export {
  REFEREE_APPLICATION_STATUS_LABELS as RefereeApplicationStatusLabels,
} from '../../shared/utils/label.maps';

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
}

export interface PouleClassificationEntry {
  rank: number;
  athleteId: number;
  fullName: string;
  club: string | null;
  victories: number;
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
  isNational: boolean;
  participants: Participant[];
  podium: PodiumEntry[];
  standings: FinalStanding[];
  pouleClassification: PouleClassificationEntry[];
  pouleSheets: PouleSheet[];
  bracket: BracketData | null;
}

export interface Participant {
  seriesNumber: number;
  athleteId: number;
  fullName: string;
  club: string | null;
}

// ── Poule Sheet (cross-table) ─────────────────────────────────────────────────

export interface PouleSheet {
  pouleNumber: number;
  rows: PouleRow[];
}

export interface PouleRow {
  index: number;
  athleteId: number;
  fullName: string;
  club: string | null;
  /** map of opponent index → cell value e.g. "V5", "D3" */
  cells: Record<number, string>;
  victories: number;
  touchesScored: number;
  touchesReceived: number;
  indicator: number;
  rank: number;
}

// ── Bracket ───────────────────────────────────────────────────────────────────

export interface BracketData {
  rounds: BracketRound[];
}

export interface BracketRound {
  round: string;
  roundLabel: string;
  bouts: BracketBout[];
}

export interface BracketBout {
  boutId: number;
  bracketPosition: number;
  leftName: string;
  rightName: string;
  scoreLeft: number;
  scoreRight: number;
  winnerName: string | null;
  finished: boolean;
  status: 'PENDING' | 'IN_PROGRESS' | 'FINISHED';
  piste: string | null;
}

// ── Rankings por puntos (RSP) ─────────────────────────────────────────────────

export interface RankingEntryResponse {
  position: number;
  athleteId: number;
  fullName: string;
  club: string | null;
  totalPoints: number;
  tournamentsPlayed: number;
  tournaments: TournamentRankingResult[];
}

export interface TournamentRankingResult {
  tournamentId: number;
  tournamentName: string;
  date: string;
  isNational: boolean;
  placement: number;
  basePoints: number;
  coefficient: number;
  finalPoints: number;
  discarded: boolean;
}

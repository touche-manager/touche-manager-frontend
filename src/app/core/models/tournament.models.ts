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

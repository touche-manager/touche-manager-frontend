/**
 * label.maps.ts
 *
 * Single source of truth for all backend enum → Spanish display label mappings.
 * Import from here instead of defining translations in each component.
 *
 * Usage in a component:
 *   import { WEAPON_LABELS, CATEGORY_LABELS } from '@shared/utils/label.maps';
 *
 * Usage in a template (via LabelPipe):
 *   {{ tournament.weapon | label:'weapon' }}
 */

// ── Weapon ────────────────────────────────────────────────────────────────────

export type Weapon = 'FOIL' | 'EPEE' | 'SABRE';

export const WEAPON_LABELS: Record<Weapon, string> = {
  FOIL:  'Florete',
  EPEE:  'Espada',
  SABRE: 'Sable',
};

// ── Category ──────────────────────────────────────────────────────────────────

export type TournamentCategory =
  | 'PRE_INFANTILE'
  | 'INFANTILE'
  | 'PRE_CADET'
  | 'CADET'
  | 'JUNIOR'
  | 'SENIOR'
  | 'VETERAN';

export const CATEGORY_LABELS: Record<TournamentCategory, string> = {
  PRE_INFANTILE: 'Pre-Infantiles',
  INFANTILE:     'Infantiles',
  PRE_CADET:     'Pre-Cadetes',
  CADET:         'Cadetes',
  JUNIOR:        'Juveniles',
  SENIOR:        'Mayores',
  VETERAN:       'Veteranos',
};

// ── Gender ────────────────────────────────────────────────────────────────────
// Canonical values matching the backend Gender enum (MALE / FEMALE).
// The UI always shows Spanish labels; the form/athlete uses these same values.

export type Gender = 'MALE' | 'FEMALE';

export const GENDER_LABELS: Record<Gender, string> = {
  MALE:   'Masculino',
  FEMALE: 'Femenino',
};

// ── Tournament Phase ───────────────────────────────────────────────────────────

export type TournamentPhase =
  | 'ENROLLMENT'
  | 'POULES_IN_PROGRESS'
  | 'ELIMINATION_IN_PROGRESS'
  | 'FINISHED';

export const TOURNAMENT_PHASE_LABELS: Record<TournamentPhase, string> = {
  ENROLLMENT:               'Inscripciones',
  POULES_IN_PROGRESS:       'Poules en Curso',
  ELIMINATION_IN_PROGRESS:  'Eliminatorias en Curso',
  FINISHED:                 'Finalizado',
};

// ── Dominant Hand ─────────────────────────────────────────────────────────────

export type DominantHand = 'RIGHT' | 'LEFT';

export const DOMINANT_HAND_LABELS: Record<DominantHand, string> = {
  RIGHT: 'Diestro',
  LEFT:  'Zurdo',
};

// ── Enrollment Status ─────────────────────────────────────────────────────────

export type EnrollmentStatus = 'PENDING_PAYMENT' | 'PAID' | 'CANCELLED';

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  PENDING_PAYMENT: 'Pendiente de Pago',
  PAID:            'Inscripto',
  CANCELLED:       'Cancelado',
};

// ── Elimination Round ─────────────────────────────────────────────────────────

export type EliminationRound =
  | 'ROUND_OF_64'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTERFINAL'
  | 'SEMIFINAL'
  | 'FINAL';

export const ELIMINATION_ROUND_LABELS: Record<EliminationRound, string> = {
  ROUND_OF_64:  '64avos',
  ROUND_OF_32:  '32avos',
  ROUND_OF_16:  '16avos',
  QUARTERFINAL: 'Cuartos de Final',
  SEMIFINAL:    'Semifinales',
  FINAL:        'Final',
};

// ── Document Validation Status ────────────────────────────────────────────────

export type DocumentValidationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export const DOCUMENT_VALIDATION_STATUS_LABELS: Record<DocumentValidationStatus, string> = {
  PENDING:  'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
};

// ── Document Type ─────────────────────────────────────────────────────────────

export type DocumentType = 'MEDICAL_CLEARANCE' | 'PAYMENT_RECEIPT';

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  MEDICAL_CLEARANCE: 'Apto Médico',
  PAYMENT_RECEIPT:   'Comprobante de Pago',
};

// ── Referee Application Status ────────────────────────────────────────────────

export type RefereeApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export const REFEREE_APPLICATION_STATUS_LABELS: Record<RefereeApplicationStatus, string> = {
  PENDING:  'Pendiente',
  ACCEPTED: 'Aceptado',
  REJECTED: 'Rechazado',
};

// ── Master lookup (used by LabelPipe) ────────────────────────────────────────

export type LabelMapKey =
  | 'weapon'
  | 'category'
  | 'gender'
  | 'phase'
  | 'hand'
  | 'enrollmentStatus'
  | 'eliminationRound'
  | 'documentStatus'
  | 'documentType'
  | 'refereeStatus';

export const LABEL_MAPS: Record<LabelMapKey, Record<string, string>> = {
  weapon:           WEAPON_LABELS,
  category:         CATEGORY_LABELS,
  gender:           GENDER_LABELS,
  phase:            TOURNAMENT_PHASE_LABELS,
  hand:             DOMINANT_HAND_LABELS,
  enrollmentStatus: ENROLLMENT_STATUS_LABELS,
  eliminationRound: ELIMINATION_ROUND_LABELS,
  documentStatus:   DOCUMENT_VALIDATION_STATUS_LABELS,
  documentType:     DOCUMENT_TYPE_LABELS,
  refereeStatus:    REFEREE_APPLICATION_STATUS_LABELS,
};

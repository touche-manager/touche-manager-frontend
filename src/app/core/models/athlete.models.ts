// Gender and DominantHand use the same values as the backend enum (no translation needed at model level).
// Use LabelPipe with 'gender' or 'hand' keys to display in Spanish.
export type Gender = 'MALE' | 'FEMALE';
export type DominantHand = 'RIGHT' | 'LEFT';

export interface AthleteRequest {
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string; // LocalDate as YYYY-MM-DD string
  gender: Gender;
  dominantHand: DominantHand;
  club: string;
  province: string;
}

export interface AthleteResponse {
  id: number;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  gender: Gender;
  dominantHand: DominantHand;
  club: string;
  province: string;
}

export type DocumentType = 'MEDICAL_CLEARANCE' | 'PAYMENT_RECEIPT';

export interface AthleteDocumentResponse {
  id: number;
  athleteId: number;
  contentType: string;
  documentType: DocumentType;
  description?: string;
  uploadDate: string;
}

export { DOCUMENT_TYPE_LABELS as DocumentTypeLabels } from '../../shared/utils/label.maps';

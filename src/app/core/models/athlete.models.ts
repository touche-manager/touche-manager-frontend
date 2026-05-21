export type Gender = 'MASCULINO' | 'FEMENINO';
export type DominantHand = 'DIESTRO' | 'ZURDO';

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
  fileName: string;
  contentType: string;
  documentType: DocumentType;
  description?: string;
  uploadDate: string;
}

export const DocumentTypeLabels: Record<DocumentType, string> = {
  MEDICAL_CLEARANCE: 'Apto Médico',
  PAYMENT_RECEIPT: 'Comprobante de Pago'
};

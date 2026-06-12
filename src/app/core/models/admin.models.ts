import { RoleName } from './auth.models';

export interface AdminUserResponse {
  id: number;
  email: string;
  active: boolean;
  createdAt: string;
  roles: RoleName[];
}

export interface UpdateUserRoleRequest {
  role: RoleName;
  action: 'ADD' | 'REMOVE';
}

export interface AdminStatsResponse {
  totalUsers: number;
  totalAthletes: number;
  totalTournaments: number;
  activeTournaments: number;
  finishedTournaments: number;
  totalEnrollments: number;
  pendingDocuments: number;
}

export interface AdminPendingDocumentResponse {
  documentId: number;
  athleteId: number;
  athleteName: string;
  dni: string;
  club: string | null;
  documentType: 'MEDICAL_CLEARANCE' | 'PAYMENT_RECEIPT';
  fileKey: string;
  description: string | null;
  uploadDate: string;
}

export interface AdminDocumentValidationRequest {
  validationStatus: 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
}

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

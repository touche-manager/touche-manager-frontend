export type NombreRol = 'ATLETA' | 'ARBITRO' | 'ORGANIZADOR' | 'ADMIN';

export interface RegisterRequest {
  email: string;
  password: string;
  roles: NombreRol[];
}

export interface RegisterResponse {
  id: number;
  email: string;
  roles: NombreRol[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

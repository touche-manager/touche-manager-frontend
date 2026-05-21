export type NombreRol = 'ATLETA' | 'ARBITRO' | 'ORGANIZADOR' | 'ADMIN';

// Registration
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

// Login
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Mutually exclusive:
 * - token is set when user has a single role → navigate to dashboard
 * - roles is set when user has multiple roles → navigate to /auth/select-role
 */
export interface LoginResponse {
  token?: string;
  roles?: NombreRol[];
}

// Select role
export interface SelectRoleRequest {
  rol: NombreRol;
}

// Shared API wrapper
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// User profile
export interface UserProfile {
  id: number;
  email: string;
  roles: NombreRol[];
  profilePictureUrl: string | null;
}

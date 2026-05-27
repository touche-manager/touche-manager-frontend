export type RoleName = 'ATHLETE' | 'REFEREE' | 'ORGANIZER' | 'ADMIN';

// Registration
export interface RegisterRequest {
  email: string;
  password: string;
  roles: RoleName[];
}

export interface RegisterResponse {
  id: number;
  email: string;
  roles: RoleName[];
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
  roles?: RoleName[];
}

// Select role
export interface SelectRoleRequest {
  role: RoleName;
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
  roles: RoleName[];
  profilePictureUrl: string | null;
}

/**
 * @file common.types.ts
 * @description Common identity, role, and API error contract definitions.
 */

export type UserRole = 'user' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'deactivated';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  accountStatus?: AccountStatus;
  avatarUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}


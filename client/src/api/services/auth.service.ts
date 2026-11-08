/**
 * @file auth.service.ts
 * @description API service methods for user registration, authentication, token refresh, and logout.
 */

import { client } from '../core/client';
import { Storage } from '../core/storage';
import { AuthResponse, LoginDto, RegisterDto } from '../types';

export const authService = {
  /**
   * Registers a new student or community user with credentials.
   * Automatically caches returned tokens and user profile on success.
   * @param data Registration payload matching registerSchema
   */
  async register(data: RegisterDto): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/auth/register', data, {
      requiresAuth: false,
    });
    await Storage.setAccessToken(response.accessToken);
    await Storage.setRefreshToken(response.refreshToken);
    await Storage.setUserCache(JSON.stringify(response.user));
    return response;
  },

  /**
   * Authenticates an existing user via email and password.
   * Stores access and refresh tokens upon successful credential verification.
   * @param data Login payload matching loginSchema
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await client.post<AuthResponse>('/auth/login', data, {
      requiresAuth: false,
    });
    await Storage.setAccessToken(response.accessToken);
    await Storage.setRefreshToken(response.refreshToken);
    await Storage.setUserCache(JSON.stringify(response.user));
    return response;
  },

  /**
   * Refreshes expired access token using an active refresh token.
   * @param refreshToken Cryptographic refresh token
   */
  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const response = await client.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken },
      { requiresAuth: false }
    );
    await Storage.setAccessToken(response.accessToken);
    await Storage.setRefreshToken(response.refreshToken);
    return response;
  },

  /**
   * Invalidate current session and removes tokens from persistent storage.
   */
  async logout(): Promise<void> {
    const refreshToken = await Storage.getRefreshToken();
    if (refreshToken) {
      try {
        await client.post('/auth/logout', { refreshToken }, { requiresAuth: true });
      } catch {
        // Suppress network errors during logout to guarantee client-side cleanup
      }
    }
    await Storage.clearAuth();
  },
};


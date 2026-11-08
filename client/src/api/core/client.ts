/**
 * @file client.ts
 * @description Centralized HTTP client wrapping Fetch with automatic Bearer token injection,
 * single-flight token refresh mutex, structured error normalization, and platform-aware base URL resolution.
 */

import { Platform } from 'react-native';
import { Storage } from './storage';
import { ApiErrorResponse } from '../types/common.types';

/**
 * Custom error class wrapping API error responses with HTTP status codes and parsed validation messages.
 */
export class ApiError extends Error {
  public statusCode: number;
  public details?: string | string[];

  constructor(statusCode: number, message: string, details?: string | string[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/** Resolves appropriate host endpoint depending on execution environment */
function getDefaultBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
}

const BASE_URL = getDefaultBaseUrl();

/** Single-flight token refresh synchronization variables */
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: any) => void;
}> = [];

/**
 * Resolves queued API calls waiting for a single token refresh operation to finish.
 * @param token Newly acquired access token
 */
function processQueue(token: string | null, error: any = null): void {
  refreshQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  refreshQueue = [];
}

/**
 * Performs token rotation against the backend when an existing access token expires.
 * Uses a single-flight mutex to prevent concurrent refresh requests from invalidating one another.
 */
async function performTokenRefresh(): Promise<string> {
  const refreshToken = await Storage.getRefreshToken();
  if (!refreshToken) {
    throw new ApiError(401, 'No refresh token available');
  }

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    await Storage.clearAuth();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  const data = await response.json();
  await Storage.setAccessToken(data.accessToken);
  await Storage.setRefreshToken(data.refreshToken);
  return data.accessToken;
}

export interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

/**
 * Dispatches an HTTP request to the KayaConnect backend.
 * @param endpoint Relative URL path starting after /api/v1
 * @param options Fetch options including HTTP method and payload
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, headers: customHeaders, ...restOptions } = options;
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  if (!(restOptions.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (requiresAuth) {
    const token = await Storage.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, { ...restOptions, headers });
  } catch (networkErr: any) {
    throw new ApiError(0, networkErr.message || 'Network request failed. Is the API server running?');
  }

  if (response.status === 401 && requiresAuth && !endpoint.includes('/auth/')) {
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newAccessToken) => {
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        return fetch(url, { ...restOptions, headers }).then((res) => handleResponse<T>(res));
      });
    }

    isRefreshing = true;
    try {
      const newAccessToken = await performTokenRefresh();
      processQueue(newAccessToken, null);
      headers['Authorization'] = `Bearer ${newAccessToken}`;
      const retried = await fetch(url, { ...restOptions, headers });
      return handleResponse<T>(retried);
    } catch (refreshErr) {
      processQueue(null, refreshErr);
      throw refreshErr;
    } finally {
      isRefreshing = false;
    }
  }

  return handleResponse<T>(response);
}

/**
 * Normalizes HTTP response data or throws structured ApiError on non-2xx status.
 * @param response Fetch Response object
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  if (!response.ok) {
    const errorBody = data as ApiErrorResponse;
    const message = Array.isArray(errorBody.message)
      ? errorBody.message.join(', ')
      : errorBody.message || response.statusText || 'Request failed';
    throw new ApiError(response.status, message, errorBody.message);
  }

  return data as T;
}

export const client = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};


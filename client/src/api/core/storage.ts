/**
 * @file storage.ts
 * @description Cross-platform persistent token and session storage adapter.
 * Uses browser localStorage on web and an in-memory/file-safe fallback on native platforms.
 */

import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'kc_access_token';
const REFRESH_TOKEN_KEY = 'kc_refresh_token';
const USER_CACHE_KEY = 'kc_user_cache';

/** In-memory fallback map for environments where window.localStorage is unavailable */
const memoryStore = new Map<string, string>();

/**
 * Storage adapter providing unified async get/set/remove methods.
 */
export const Storage = {
  /**
   * Retrieves an item by key from persistent storage.
   * @param key Storage key identifier
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return memoryStore.get(key) ?? null;
    } catch {
      return memoryStore.get(key) ?? null;
    }
  },

  /**
   * Stores a string item in persistent storage.
   * @param key Storage key identifier
   * @param value String value to store
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      memoryStore.set(key, value);
    } catch {
      memoryStore.set(key, value);
    }
  },

  /**
   * Removes an item by key from storage.
   * @param key Storage key identifier
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      memoryStore.delete(key);
    } catch {
      memoryStore.delete(key);
    }
  },

  /**
   * Clears all authentication credentials from storage.
   */
  async clearAuth(): Promise<void> {
    await Promise.all([
      this.removeItem(ACCESS_TOKEN_KEY),
      this.removeItem(REFRESH_TOKEN_KEY),
      this.removeItem(USER_CACHE_KEY),
    ]);
  },

  getAccessToken(): Promise<string | null> {
    return this.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string): Promise<void> {
    return this.setItem(ACCESS_TOKEN_KEY, token);
  },

  getRefreshToken(): Promise<string | null> {
    return this.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string): Promise<void> {
    return this.setItem(REFRESH_TOKEN_KEY, token);
  },

  getUserCache(): Promise<string | null> {
    return this.getItem(USER_CACHE_KEY);
  },

  setUserCache(userJson: string): Promise<void> {
    return this.setItem(USER_CACHE_KEY, userJson);
  },
};


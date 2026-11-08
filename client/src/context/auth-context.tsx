/**
 * @file auth-context.tsx
 * @description Authentication context provider managing user sessions, JWT tokens, automatic bootstrapping,
 * login, registration, and logout workflows.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '@/api/services/auth.service';
import { ApiError } from '@/api/core/client';
import { Storage } from '@/api/core/storage';
import { User, UserProfile } from '@/api/types';
import { usersService } from '@/api/services/users.service';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (fullName: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  sessionError: string | null;
  retrySession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const hydrateSession = async () => {
    const token = await Storage.getAccessToken();
    if (!token) return;
    try {
      const me = await usersService.getMe();
      const nextUser: User = {
        id: me.id,
        fullName: me.fullName,
        email: me.email,
        role: me.role,
        avatarUrl: me.avatarUrl,
      };
      setUser(nextUser);
      await Storage.setUserCache(JSON.stringify(nextUser));
      setProfile(me.profile);
      setSessionError(null);
    } catch (err: any) {
      if (err instanceof ApiError && [401, 403].includes(err.statusCode)) {
        await Storage.clearAuth();
        setUser(null);
        setProfile(null);
        return;
      }
      const cachedUser = await Storage.getUserCache();
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser) as User);
        } catch {
          // A malformed cache is safe to ignore; tokens remain available for retry.
        }
      }
      setSessionError('Unable to refresh your account. Check your connection and try again.');
    }
  };

  // Rehydrate existing session from storage on app launch
  useEffect(() => {
    async function bootstrapSession() {
      try {
        await hydrateSession();
      } catch {
        setSessionError('Unable to restore your session. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    bootstrapSession();
  }, []);

  const retrySession = async () => {
    setIsLoading(true);
    try {
      await hydrateSession();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login({ email, password: pass });
      setUser(res.user);
      try {
        await hydrateSession();
      } catch {
        setSessionError('Signed in, but profile details could not be loaded yet.');
      }
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (fullName: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await authService.register({ fullName, email, password: pass });
      setUser(res.user);
      try {
        await hydrateSession();
      } catch {
        setSessionError('Account created, but profile details could not be loaded yet.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      const me = await usersService.getMe();
      const nextUser: User = {
        id: me.id,
        fullName: me.fullName,
        email: me.email,
        role: me.role,
        avatarUrl: me.avatarUrl,
      };
      setUser(nextUser);
      await Storage.setUserCache(JSON.stringify(nextUser));
      setProfile(me.profile);
      setSessionError(null);
    } catch (err: any) {
      setSessionError(err?.message || 'Unable to refresh your account details.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        sessionError,
        retrySession,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


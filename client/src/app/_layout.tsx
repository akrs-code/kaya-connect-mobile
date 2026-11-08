/**
 * @file _layout.tsx
 * @description Root application layout wrapping the app in theme, authentication,
 * and onboarding context providers with seamless stack navigation.
 */

import { DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/context/auth-context';
import { OnboardingProvider } from '@/context/onboarding-context';
import { ThemePreferenceProvider } from '@/context/theme-context';
import { useAuth } from '@/context/auth-context';
import { roleDefaultRoute } from '@/constants/role-navigation';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemePreferenceProvider>
      <RootNavigator />
    </ThemePreferenceProvider>
  );
}

function RootNavigator() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <AuthProvider>
        <OnboardingProvider>
          <RoleRouteGuard />
          <AnimatedSplashOverlay />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="auth/register" />
            <Stack.Screen name="auth/login" />
            <Stack.Screen name="onboarding/step-1" />
            <Stack.Screen name="onboarding/step-2" />
            <Stack.Screen name="onboarding/step-3" />
            <Stack.Screen name="onboarding/complete" />
            <Stack.Screen name="profile/index" />
            <Stack.Screen name="profile/edit" />
            <Stack.Screen name="users/[id]" />
            <Stack.Screen name="opportunities/[id]" />
            <Stack.Screen name="opportunities/create" />
            <Stack.Screen name="opportunities/mine" />
            <Stack.Screen name="opportunities/[id]/applicants" />
            <Stack.Screen name="applications/index" />
            <Stack.Screen name="notifications/index" />
            <Stack.Screen name="messages/index" />
            <Stack.Screen name="messages/[id]" />
            <Stack.Screen name="assignments/[id]/index" />
            <Stack.Screen name="assignments/index" />
            <Stack.Screen name="assignments/[id]/agreement" />
            <Stack.Screen name="assignments/[id]/payment" />
            <Stack.Screen name="assignments/[id]/review" />
            <Stack.Screen name="reports/create" />
            <Stack.Screen name="admin/index" />
            <Stack.Screen name="admin/moderation" />
            <Stack.Screen name="admin/audit" />
            <Stack.Screen name="admin/categories" />
          </Stack>
        </OnboardingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

/** Blocks deep links into a role's private routes and returns to its home tab. */
function RoleRouteGuard() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  React.useEffect(() => {
    if (!isAuthenticated || !user) return;
    const isAdminRoute = segments[0] === 'admin';
    const isAuthRoute = segments[0] === 'auth';

    if (user.role === 'admin' && !isAdminRoute) {
      router.replace(roleDefaultRoute.admin as any);
    } else if (user.role === 'user' && isAdminRoute) {
      router.replace(roleDefaultRoute.user as any);
    } else if (isAuthRoute) {
      router.replace(roleDefaultRoute[user.role] as any);
    }
  }, [isAuthenticated, router, segments, user]);

  return null;
}

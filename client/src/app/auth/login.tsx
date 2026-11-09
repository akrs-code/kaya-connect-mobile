/**
 * @file login.tsx
 * @description Screen 1.6: Account Login with email/student identifier, password verification,
 * and direct authentication with the NestJS backend.
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Icon, Input, TopAppBar } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

/**
 * LoginScreen Component
 * 
 * Manages user sign-in flow by validating email and password credentials,
 * issuing a call to the backend `POST /auth/login` endpoint via `AuthContext`,
 * storing returned JWT tokens, and redirecting to the main dashboard.
 */
export default function LoginScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    setErrorMessage('');
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const signedInUser = await login(email.trim().toLowerCase(), password);
      router.replace(signedInUser.role === 'admin' ? '/admin/moderation' : '/');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <TopAppBar
        title="KayaConnect"
        showBack={true}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Brand Anchor & Header */}
          <View style={styles.brandSection}>
            <View
              style={[
                styles.iconBubble,
                { backgroundColor: colors.paidBg, borderColor: colors.border },
              ]}>
              <Icon name="handshake" size={28} color={colors.primary} filled />
            </View>

            <Text style={[styles.mainHeading, { color: colors.onSurface }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subHeading, { color: colors.onSurfaceVariant }]}>
              MSU Main Campus & Marawi City Skills and Mutual Resource Exchange
            </Text>
          </View>

          {/* Segmented Top Tabs */}
          <View style={[styles.segmentedContainer, { backgroundColor: colors.surfaceSecondary }]}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push('/auth/register')}
              style={styles.segmentedTab}>
              <Text style={[styles.segmentedInactiveText, { color: colors.onSurfaceVariant }]}>
                Register
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.segmentedTab,
                { backgroundColor: colors.primaryContainer },
              ]}>
              <Text style={[styles.segmentedActiveText, { color: colors.onPrimary }]}>
                Log In
              </Text>
            </TouchableOpacity>
          </View>

          {/* Credentials Card */}
          <Card style={styles.formCard}>
            <Input
              label="Email Address"
              placeholder="sittie.lucman@msumain.edu.ph"
              leftIcon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Input
              label="Password"
              placeholder="Enter your password"
              leftIcon="lock"
              isPassword
              value={password}
              onChangeText={setPassword}
            />

            {/* Error Feedback */}
            {errorMessage ? (
              <View style={[styles.errorBanner, { backgroundColor: colors.alertBg }]}>
                <Icon name="error" size={16} color={colors.alertText} />
                <Text style={[styles.errorBannerText, { color: colors.alertText }]}>
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <Button
              title="Log In"
              rightIcon="arrow_forward"
              loading={loading}
              onPress={handleLogin}
              style={styles.loginBtn}
            />
          </Card>

          {/* Bottom Link */}
          <View style={styles.bottomLinkContainer}>
            <Text style={[styles.bottomLinkText, { color: colors.onSurfaceVariant }]}>
              Don't have an account?{' '}
              <Text
                onPress={() => router.push('/auth/register')}
                style={[styles.bottomLinkAction, { color: colors.primary }]}>
                Register
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl * 2,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  brandSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  iconBubble: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.4,
    marginBottom: Spacing.xs - 2,
  },
  subHeading: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 18,
  },
  segmentedContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    padding: 3,
    marginBottom: Spacing.md,
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedActiveText: {
    fontSize: 13,
    fontWeight: '600',
  },
  segmentedInactiveText: {
    fontSize: 13,
    fontWeight: '500',
  },
  formCard: {
    marginBottom: Spacing.md,
  },
  loginBtn: {
    marginTop: Spacing.xs,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.xs,
  },
  errorBannerText: {
    fontSize: 12,
    flex: 1,
    fontWeight: '500',
  },
  bottomLinkContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  bottomLinkText: {
    fontSize: 13,
  },
  bottomLinkAction: {
    fontWeight: '700',
  },
});

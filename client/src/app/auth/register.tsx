/**
 * @file register.tsx
 * @description Screen 1.1: Account Registration with student credentials, password validation,
 * community terms agreement, and direct transition to profile onboarding.
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
import { Button, Card, Icon, Input, TopAppBar, WizardStepper } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

/**
 * RegisterScreen Component
 * 
 * Handles initial user account creation. Enforces client-side validation rules
 * (full name, valid email, minimum 8-character password confirmation, terms agreement)
 * and invokes `POST /auth/register` to establish the user account before progressing
 * to Step 1 of onboarding.
 */
export default function RegisterScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleRegister = async () => {
    setErrorMessage('');
    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name as shown on your official ID.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid campus or personal email address.');
      return;
    }
    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters with letters and numbers.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter carefully.');
      return;
    }
    if (!agreedToTerms) {
      setErrorMessage('Please agree to the Community Terms and Data Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      await register(fullName.trim(), email.trim().toLowerCase(), password);
      router.replace('/onboarding/step-1');
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <TopAppBar
        title="KayaConnect"
        showBack={true}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/auth/login'))}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Brand Header */}
          <View style={styles.brandSection}>
            <View
              style={[
                styles.iconBubble,
                { backgroundColor: colors.paidBg, borderColor: colors.border },
              ]}>
              <Icon name="handshake" size={26} color={colors.primaryContainer} filled />
            </View>

            <Text style={[styles.mainHeading, { color: colors.onSurface }]}>
              Join KayaConnect
            </Text>
            <Text style={[styles.subHeading, { color: colors.onSurfaceVariant }]}>
              MSU Main Campus & Marawi City Skills and Mutual Resource Exchange
            </Text>
          </View>

          {/* Segmented Switch: Register / Log In */}
          <View style={[styles.segmentedContainer, { backgroundColor: colors.surfaceSecondary }]}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[
                styles.segmentedTab,
                { backgroundColor: colors.primaryContainer },
              ]}>
              <Text style={[styles.segmentedActiveText, { color: colors.onPrimary }]}>
                Register
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => router.push('/auth/login')}
              style={styles.segmentedTab}>
              <Text style={[styles.segmentedInactiveText, { color: colors.onSurfaceVariant }]}>
                Log In
              </Text>
            </TouchableOpacity>
          </View>

          {/* Registration Form Card */}
          <Card style={styles.formCard}>
            <Input
              label="Full Name"
              subLabel="Official MSU/Gov ID"
              placeholder="e.g., Sittie Aminah Lucman"
              leftIcon="person"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />

            <Input
              label="Campus or Personal Email"
              subLabel="@msumain.edu.ph preferred"
              subLabelColor={colors.secondary}
              placeholder="sittie.lucman@msumain.edu.ph"
              leftIcon="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Input
              label="Password"
              placeholder="Min. 8 alphanumeric characters"
              leftIcon="lock"
              isPassword
              value={password}
              onChangeText={setPassword}
            />

            <Input
              label="Confirm Password"
              placeholder="Re-type your password"
              leftIcon="lock_reset"
              isPassword
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <WizardStepper
              step={1}
              totalSteps={3}
              stepTitle="Credentials"
              percentage={33}
            />
          </Card>

          {/* Terms & Consent Checkbox */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setAgreedToTerms((prev) => !prev)}
            style={styles.termsRow}>
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: agreedToTerms ? colors.primaryContainer : 'transparent',
                  borderColor: agreedToTerms ? colors.primaryContainer : colors.border,
                },
              ]}>
              {agreedToTerms && <Icon name="check" size={14} color={colors.onPrimary} />}
            </View>
            <Text style={[styles.termsText, { color: colors.onSurfaceVariant }]}>
              I agree to the{' '}
              <Text style={{ color: colors.primaryContainer, fontWeight: '600' }}>
                Community Terms of Service
              </Text>{' '}
              and{' '}
              <Text style={{ color: colors.primaryContainer, fontWeight: '600' }}>
                Data Privacy Policy
              </Text>
              .
            </Text>
          </TouchableOpacity>

          {/* Validation Error Banner */}
          {errorMessage ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.alertBg }]}>
              <Icon name="error" size={16} color={colors.alertText} />
              <Text style={[styles.errorBannerText, { color: colors.alertText }]}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          {/* Primary Submit CTA */}
          <Button
            title="Create Account & Continue to Profile Setup"
            rightIcon="arrow_forward"
            loading={loading}
            onPress={handleRegister}
            style={styles.ctaButton}
          />

          {/* Bottom Login Link */}
          <View style={styles.bottomLinkContainer}>
            <Text style={[styles.bottomLinkText, { color: colors.onSurfaceVariant }]}>
              Already have an account?{' '}
              <Text
                onPress={() => router.push('/auth/login')}
                style={[styles.bottomLinkAction, { color: colors.primaryContainer }]}>
                Log In
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
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs - 2,
    letterSpacing: -0.4,
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
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
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
  ctaButton: {
    marginBottom: Spacing.md,
  },
  bottomLinkContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  bottomLinkText: {
    fontSize: 13,
  },
  bottomLinkAction: {
    fontWeight: '600',
  },
});

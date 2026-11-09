/**
 * @file complete.tsx
 * @description Screen 1.5: Onboarding Complete & Dashboard Redirect with verified profile summary
 * and direct transition to the main dashboard.
 */

import { useRouter } from 'expo-router';
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Icon, TopAppBar, WizardStepper } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useOnboarding } from '@/context/onboarding-context';

/**
 * OnboardingCompleteScreen Component
 * 
 * Success confirmation screen acknowledging verified profile submission.
 * Presents a summary of the configured preferences and routes the user into the
 * main discovery feed.
 */
export default function OnboardingCompleteScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { user } = useAuth();
  const { draft } = useOnboarding();

  const displayName = user?.fullName?.split(' ')[0] || 'Community Member';

  const getRoleTitle = () => {
    switch (draft.intent) {
      case 'provider':
        return 'Service Provider';
      case 'requester':
        return 'Task Requester';
      case 'both':
      default:
        return 'Service Provider & Requester';
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <TopAppBar
        title="KayaConnect"
        showBack={false}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Stepper Indicator: 100% Completed */}
        <View style={styles.stepperContainer}>
          <WizardStepper
            step={3}
            totalSteps={3}
            stepTitle="Setup Complete"
            percentage={100}
          />
        </View>

        {/* Verification Success Header */}
        <View style={styles.celebrateSection}>
          <View style={[styles.centralBadge, { backgroundColor: colors.secondary }]}>
            <Icon name="check" size={32} color={colors.onSecondary} filled />
          </View>

          <Text style={[styles.mainHeadline, { color: colors.onSurface }]}>
            Profile ready, {displayName}
          </Text>
          <Text style={[styles.subHeadline, { color: colors.onSurfaceVariant }]}>
            You can update your profile anytime.
          </Text>
        </View>

        {/* Verified Profile Summary Card */}
        <Card style={styles.summaryCard}>
          <Text style={[styles.roleTitle, { color: colors.onSurface }]}>
            {getRoleTitle()}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="location_on" size={16} color={colors.primaryContainer} />
              <Text style={[styles.metaText, { color: colors.onSurface }]}>
                {draft.serviceArea}
              </Text>
            </View>
          </View>

          {/* Active Skills Grid */}
          {draft.skills.length > 0 && (
            <>
              <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />
              <View>
                <View style={styles.skillsHeaderRow}>
                  <Text style={[styles.skillsHeaderTitle, { color: colors.outline }]}>
                    SKILLS
                  </Text>
                  <Text style={[styles.skillsCount, { color: colors.primaryContainer }]}>
                    {draft.skills.length}
                  </Text>
                </View>

                <View style={styles.skillsChipsWrap}>
                  {draft.skills.map((skill) => (
                    <View
                      key={skill}
                      style={[
                        styles.enrolledSkillChip,
                        {
                          backgroundColor: colors.surfaceSecondary,
                          borderColor: colors.border,
                        },
                      ]}>
                      <Icon name="palette" size={14} color={colors.primaryContainer} />
                      <Text style={[styles.enrolledSkillText, { color: colors.onSurface }]}>
                        {skill}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </Card>

        {/* Go to Dashboard CTA */}
        <Button
          title="Start browsing"
          rightIcon="arrow_forward"
          onPress={() => router.replace('/')}
          style={styles.dashboardBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.gutter,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl * 2,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  stepperContainer: {
    marginBottom: Spacing.md,
  },
  celebrateSection: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  centralBadge: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.md,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainHeadline: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  subHeadline: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 300,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryBadgeRow: {
    marginBottom: Spacing.xs,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bullet: {
    fontSize: 12,
  },
  metaSub: {
    fontSize: 12,
  },
  cardDivider: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.sm,
  },
  skillsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs + 2,
  },
  skillsHeaderTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  skillsCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  skillsChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  enrolledSkillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: 4,
  },
  enrolledSkillText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  dashboardBtn: {
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
});

/**
 * @file step-1.tsx
 * @description Screen 1.2: Onboarding Wizard Step 1 - Primary Intent / Role Selection,
 * Pilot Service Area, and Profile Tagline.
 */

import { useRouter } from 'expo-router';
import React from 'react';
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
import { Button, Card, Icon, Textarea, TopAppBar, WizardStepper } from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/context/onboarding-context';

const SERVICE_AREAS = [
  'MSU Main Campus - Dorms/Halls',
  'MSU Commercial Center',
  'Marawi City Central',
  'Outskirts / Neighboring Barangay',
];

/**
 * OnboardingStep1Screen Component
 * 
 * Guides the user through Step 1 of the onboarding wizard: selecting their primary engagement intent
 * (student freelancer, campus mutual aid volunteer, or task requester), designating active service
 * areas in MSU / Marawi, and crafting an introductory bio.
 */
export default function OnboardingStep1Screen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const { draft, setIntent, setServiceArea, setBiography } = useOnboarding();

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <TopAppBar
        title="KayaConnect"
        showBack={true}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/auth/register'))}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Step Progress Header */}
          <View style={styles.stepperContainer}>
            <WizardStepper
              step={1}
              totalSteps={3}
              stepTitle="Preferences"
              percentage={33}
            />
          </View>

          {/* Welcome Hero Header */}
          <View style={styles.heroSection}>
            <Text style={[styles.mainHeadline, { color: colors.onSurface }]}>
              Set your preferences
            </Text>
            <Text style={[styles.bodyDescription, { color: colors.onSurfaceVariant }]}>
              Choose how you will use KayaConnect.
            </Text>
          </View>

          {/* Section: Role Intention Selector */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>
              How will you use KayaConnect? <Text style={{ color: colors.error }}>*</Text>
            </Text>

            <View style={styles.roleCardList}>
              {/* Card A: Service Provider */}
              <Card
                selected={draft.intent === 'provider'}
                onPress={() => setIntent('provider')}
                style={styles.roleCard}>
                <View style={styles.roleCardContent}>
                  <View style={styles.roleLeftRow}>
                    <View
                      style={[
                        styles.roleIconBox,
                        {
                          backgroundColor: draft.intent === 'provider' ? colors.paidBg : colors.surfaceSecondary,
                          borderColor: colors.border,
                        },
                      ]}>
                      <Icon
                        name="engineering"
                        size={22}
                        color={draft.intent === 'provider' ? colors.paidText : colors.onSurfaceVariant}
                      />
                    </View>
                    <View style={styles.roleTextCol}>
                      <Text style={[styles.roleTitle, { color: colors.onSurface }]}>
                        Offer help
                      </Text>
                      <Text style={[styles.roleDesc, { color: colors.onSurfaceVariant }]}>
                        Find work and help others.
                      </Text>

                    </View>
                  </View>

                  <View
                    style={[
                      styles.checkIndicator,
                      {
                        backgroundColor: draft.intent === 'provider' ? colors.primaryContainer : 'transparent',
                        borderColor: draft.intent === 'provider' ? colors.primaryContainer : colors.outlineVariant,
                      },
                    ]}>
                    {draft.intent === 'provider' && (
                      <Icon name="check" size={14} color={colors.onPrimary} />
                    )}
                  </View>
                </View>
              </Card>

              {/* Card B: Task Requester */}
              <Card
                selected={draft.intent === 'requester'}
                onPress={() => setIntent('requester')}
                style={styles.roleCard}>
                <View style={styles.roleCardContent}>
                  <View style={styles.roleLeftRow}>
                    <View
                      style={[
                        styles.roleIconBox,
                        {
                          backgroundColor: draft.intent === 'requester' ? colors.paidBg : colors.surfaceSecondary,
                          borderColor: colors.border,
                        },
                      ]}>
                      <Icon
                        name="assignment_add"
                        size={22}
                        color={draft.intent === 'requester' ? colors.paidText : colors.onSurfaceVariant}
                      />
                    </View>
                    <View style={styles.roleTextCol}>
                      <Text style={[styles.roleTitle, { color: colors.onSurface }]}>
                        Request help
                      </Text>
                      <Text style={[styles.roleDesc, { color: colors.onSurfaceVariant }]}>
                        Post tasks and review applicants.
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.checkIndicator,
                      {
                        backgroundColor: draft.intent === 'requester' ? colors.primaryContainer : 'transparent',
                        borderColor: draft.intent === 'requester' ? colors.primaryContainer : colors.outlineVariant,
                      },
                    ]}>
                    {draft.intent === 'requester' && (
                      <Icon name="check" size={14} color={colors.onPrimary} />
                    )}
                  </View>
                </View>
              </Card>

              {/* Card C: Both Roles */}
              <Card
                selected={draft.intent === 'both'}
                onPress={() => setIntent('both')}
                style={styles.roleCard}>
                <View style={styles.roleCardContent}>
                  <View style={styles.roleLeftRow}>
                    <View
                      style={[
                        styles.roleIconBox,
                        {
                          backgroundColor: draft.intent === 'both' ? colors.paidBg : colors.surfaceSecondary,
                          borderColor: colors.border,
                        },
                      ]}>
                      <Icon
                        name="sync_alt"
                        size={22}
                        color={draft.intent === 'both' ? colors.paidText : colors.onSurfaceVariant}
                      />
                    </View>
                    <View style={styles.roleTextCol}>
                      <Text style={[styles.roleTitle, { color: colors.onSurface }]}>
                        Both
                      </Text>
                      <Text style={[styles.roleDesc, { color: colors.onSurfaceVariant }]}>
                        Offer and request help.
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.checkIndicator,
                      {
                        backgroundColor: draft.intent === 'both' ? colors.primaryContainer : 'transparent',
                        borderColor: draft.intent === 'both' ? colors.primaryContainer : colors.outlineVariant,
                      },
                    ]}>
                    {draft.intent === 'both' && (
                      <Icon name="check" size={14} color={colors.onPrimary} />
                    )}
                  </View>
                </View>
              </Card>
            </View>
          </View>

          {/* Section: Service Area Selection */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.fieldLabel, { color: colors.onSurface }]}>
              Service area <Text style={{ color: colors.error }}>*</Text>
            </Text>

            <View style={styles.serviceAreaList}>
              {SERVICE_AREAS.map((area) => {
                const isSelected = draft.serviceArea === area;
                return (
                  <TouchableOpacity
                    key={area}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    activeOpacity={0.8}
                    onPress={() => setServiceArea(area)}
                    style={[
                      styles.serviceAreaOption,
                      {
                        backgroundColor: isSelected ? colors.surfaceSecondary : colors.surface,
                        borderColor: isSelected ? colors.primaryContainer : colors.border,
                        borderWidth: isSelected ? 1.5 : 1,
                      },
                    ]}>
                    <View style={styles.serviceAreaLeft}>
                      <Icon
                        name="location_on"
                        size={18}
                        color={isSelected ? colors.primaryContainer : colors.outline}
                      />
                      <Text
                        style={[
                          styles.serviceAreaText,
                          {
                            color: colors.onSurface,
                            fontWeight: isSelected ? '600' : '400',
                          },
                        ]}>
                        {area}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor: isSelected ? colors.primaryContainer : colors.outlineVariant,
                          backgroundColor: isSelected ? colors.primaryContainer : 'transparent',
                        },
                      ]}>
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Section: Short Bio */}
          <View style={styles.sectionBlock}>
            <Textarea
              label="About you"
              subLabel="Optional"
              helperText="Optional"
              placeholder="Brief introduction"
              maxLength={140}
              rows={3}
              value={draft.biography}
              onChangeText={setBiography}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Navigation Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.bottomBarContent}>
          <Button
            title="Skip for Now"
            variant="outline"
            onPress={() => router.replace('/')}
            style={styles.skipButton}
          />
          <Button
            title="Next: Skills"
            rightIcon="arrow_forward"
            onPress={() => router.push('/onboarding/step-2')}
            style={styles.nextButton}
          />
        </View>
      </View>
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
    paddingTop: Spacing.sm,
    paddingBottom: 110,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  stepperContainer: {
    marginBottom: Spacing.md,
  },
  heroSection: {
    marginBottom: Spacing.md,
  },
  mainHeadline: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: Spacing.xs,
  },
  bodyDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionBlock: {
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  roleCardList: {
    gap: Spacing.sm,
  },
  roleCard: {
    padding: Spacing.md,
  },
  roleCardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  roleLeftRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: Spacing.sm + 2,
  },
  roleIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTextCol: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  roleDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: Spacing.xs,
  },
  roleTagsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 2,
  },
  checkIndicator: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
  },
  serviceAreaList: {
    gap: Spacing.xs + 2,
  },
  serviceAreaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  serviceAreaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  serviceAreaText: {
    fontSize: 13,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: '#fff',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.gutter,
    paddingVertical: Spacing.sm + 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  bottomBarContent: {
    flexDirection: 'row',
    gap: Spacing.sm,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  skipButton: {
    flex: 2,
  },
  nextButton: {
    flex: 3,
  },
});

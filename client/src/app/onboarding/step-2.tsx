/**
 * @file step-2.tsx
 * @description Screen 1.3: Onboarding Wizard Step 2 - Core Skill Chips Matrix,
 * Custom Skill Tag Creation, and Experience Summary.
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
import {
  Button,
  Chip,
  Icon,
  Input,
  Textarea,
  TopAppBar,
  WizardStepper,
} from '@/components/ui';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/context/onboarding-context';

const CORE_CATEGORIES = [
  'Home Repair',
  'Tutoring',
  'Graphic Design',
  'Event Assistance',
  'Cleaning',
  'Programming',
  'Delivery/Errands',
];

/**
 * OnboardingStep2Screen Component
 * 
 * Step 2 of the onboarding process: allows users to select from recognized campus skill domains
 * and enter custom tags. Updates the draft profile state in `OnboardingContext`.
 */
export default function OnboardingStep2Screen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const {
    draft,
    toggleSkill,
    addCustomSkill,
    removeSkill,
    setExperience,
  } = useOnboarding();

  const [customInput, setCustomInput] = useState('');

  const handleAddCustom = () => {
    if (!customInput.trim()) return;
    addCustomSkill(customInput.trim());
    setCustomInput('');
  };

  const coreCategoryNormalized = CORE_CATEGORIES.map((c) => c.toLowerCase());
  const customTags = draft.skills.filter(
    (skill) => !coreCategoryNormalized.includes(skill.toLowerCase())
  );

  return (
    <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={[styles.safeArea, { backgroundColor: colors.canvas }]}>
      <TopAppBar
        title="KayaConnect"
        showBack={true}
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Stepper Header */}
          <View style={styles.stepperContainer}>
            <WizardStepper
              step={2}
              totalSteps={3}
              stepTitle="Skills & Expertise"
              percentage={66}
            />
          </View>

          {/* Header Intro */}
          <View style={styles.heroSection}>
            <Text style={[styles.mainHeadline, { color: colors.onSurface }]}>
              Add your skills
            </Text>
            <Text style={[styles.bodyDescription, { color: colors.onSurfaceVariant }]}>
              Select skills you can offer.
            </Text>
          </View>

          {/* Section 1: Core Categories Chips Matrix */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
                Skills
              </Text>
              <Text style={[styles.selectedCountText, { color: colors.outline }]}>
                {draft.skills.length} Selected
              </Text>
            </View>

            <View style={styles.chipsWrap}>
              {CORE_CATEGORIES.map((category) => {
                const isSelected = draft.skills.includes(category.toLowerCase());
                return (
                  <Chip
                    key={category}
                    label={category}
                    selected={isSelected}
                    onPress={() => toggleSkill(category)}
                  />
                );
              })}
            </View>
          </View>

          {/* Section 2: Custom Skill Tag Input */}
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: colors.onSurface }]}>
              Add a skill
            </Text>

            <View style={styles.customInputRow}>
              <View style={styles.customInputWrap}>
                <Input
                  placeholder="e.g. PC Hardware Repair"
                  leftIcon="sell"
                  value={customInput}
                  onChangeText={setCustomInput}
                  onSubmitEditing={handleAddCustom}
                />
              </View>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Add skill tag"
                activeOpacity={0.8}
                onPress={handleAddCustom}
                style={[
                  styles.addTagButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}>
                <Icon name="add" size={16} color={colors.primary} />
                <Text style={[styles.addTagText, { color: colors.primary }]}>Add</Text>
              </TouchableOpacity>
            </View>

            {/* Added Custom Tags List */}
            {customTags.length > 0 && (
              <View style={styles.tagsWrap}>
                {customTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    variant="tag"
                    onRemove={() => removeSkill(tag)}
                  />
                ))}
              </View>
            )}
          </View>

          {/* Section 3: Experience Summary */}
          <View style={styles.sectionBlock}>
            <Textarea
              label="Experience Summary"
              placeholder="Brief experience summary"
              maxLength={250}
              rows={4}
              value={draft.experience}
              onChangeText={setExperience}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky Bottom Navigation Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.bottomBarContent}>
          <Button
            title="Back"
            variant="outline"
            leftIcon="arrow_back"
            onPress={() => router.back()}
            style={styles.backButton}
          />
          <Button
            title="Next: Portfolio"
            rightIcon="arrow_forward"
            onPress={() => router.push('/onboarding/step-3')}
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
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs - 2,
  },
  bodyDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  sectionBlock: {
    marginBottom: Spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedCountText: {
    fontSize: 12,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  customInputWrap: {
    flex: 1,
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    height: 44,
    gap: 4,
  },
  addTagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: Spacing.xs,
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
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});

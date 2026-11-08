/**
 * @file wizard-stepper.tsx
 * @description Standardized onboarding wizard stepper progress bar displaying step count, title, and percentage.
 */

import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';

export interface WizardStepperProps {
  step: number;
  totalSteps?: number;
  stepTitle?: string;
  percentage?: number;
}

export function WizardStepper({
  step,
  totalSteps = 3,
  stepTitle,
  percentage,
}: WizardStepperProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const calculatedPercent =
    percentage !== undefined ? percentage : Math.round((step / totalSteps) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.labelsRow}>
        <Text style={[styles.stepLabel, { color: colors.onSurfaceVariant }]}>
          Step {step} of {totalSteps}
          {stepTitle ? `: ${stepTitle}` : ''}
        </Text>
        <Text style={[styles.percentLabel, { color: colors.primary }]}>
          {calculatedPercent}%
        </Text>
      </View>

      <View style={[styles.track, { backgroundColor: colors.surfaceSecondary }]}>
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(100, Math.max(0, calculatedPercent))}%`,
              backgroundColor: colors.primaryContainer,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: Spacing.xs,
  },
  labelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  percentLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  track: {
    height: 4,
    width: '100%',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
});


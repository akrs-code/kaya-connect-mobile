/**
 * @file badge.tsx
 * @description Standardized trust and status badge displaying verification labels, civic network indicators, and gig types.
 */

import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { Icon } from './icon';

export interface BadgeProps {
  label: string;
  icon?: string;
  variant?: 'volunteer' | 'paid' | 'neutral' | 'verified';
}

export function Badge({ label, icon, variant = 'volunteer' }: BadgeProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const getVariantStyles = () => {
    switch (variant) {
      case 'paid':
        return {
          bg: colors.paidBg,
          text: colors.paidText,
          border: colors.border,
        };
      case 'neutral':
        return {
          bg: colors.surfaceSecondary,
          text: colors.onSurfaceVariant,
          border: colors.border,
        };
      case 'verified':
      case 'volunteer':
      default:
        return {
          bg: colors.volunteerBg,
          text: colors.volunteerText,
          border: colors.secondaryContainer,
        };
    }
  };

  const vStyle = getVariantStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: vStyle.bg,
          borderColor: vStyle.border,
        },
      ]}>
      {icon && (
        <Icon
          name={icon}
          size={12}
          color={vStyle.text}
          filled
          style={styles.badgeIcon}
        />
      )}
      <Text style={[styles.badgeText, { color: vStyle.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});


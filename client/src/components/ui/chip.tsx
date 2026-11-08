/**
 * @file chip.tsx
 * @description Standardized interactive chip supporting selection toggles, removable tags, and weekly schedule day selectors.
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { Icon } from './icon';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  variant?: 'filter' | 'tag' | 'day';
  subLabel?: string;
  icon?: string;
}

export function Chip({
  label,
  selected = false,
  onPress,
  onRemove,
  variant = 'filter',
  subLabel,
  icon,
}: ChipProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // Day of week chip in Step 3 schedule selector
  if (variant === 'day') {
    return (
      <TouchableOpacity
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        activeOpacity={0.8}
        onPress={onPress}
        style={[
          styles.dayChip,
          {
            backgroundColor: selected ? colors.primaryContainer : colors.surface,
            borderColor: selected ? colors.primaryContainer : colors.border,
          },
        ]}>
        {subLabel && (
          <Text
            style={[
              styles.daySubLabel,
              { color: selected ? colors.onPrimary : colors.outline },
            ]}>
            {subLabel}
          </Text>
        )}
        <Text
          style={[
            styles.dayLabel,
            { color: selected ? colors.onPrimary : colors.onSurfaceVariant },
          ]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  // Removable tag (e.g. custom skill tags)
  if (variant === 'tag') {
    return (
      <View
        style={[
          styles.tag,
          {
            backgroundColor: colors.paidBg,
            borderColor: colors.border,
          },
        ]}>
        <Text style={[styles.tagText, { color: colors.paidText }]}>{label}</Text>
        {onRemove && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Remove ${label}`}
            onPress={onRemove}
            style={styles.removeButton}>
            <Icon name="close" size={13} color={colors.paidText} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Interactive category / skill filter chip
  return (
    <TouchableOpacity
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      activeOpacity={0.8}
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: selected ? colors.primaryContainer : colors.surface,
          borderColor: selected ? colors.primaryContainer : colors.border,
        },
      ]}>
      <Icon
        name={selected ? 'check' : icon || 'add'}
        size={15}
        color={selected ? colors.onPrimary : colors.outline}
        style={styles.chipIcon}
      />
      <Text
        style={[
          styles.filterLabel,
          {
            color: selected ? colors.onPrimary : colors.onSurface,
            fontWeight: selected ? '600' : '500',
          },
        ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 3,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.xs + 2,
    marginBottom: Spacing.xs + 2,
  },
  chipIcon: {
    marginRight: Spacing.xs,
  },
  filterLabel: {
    fontSize: 13,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: Spacing.xs,
  },
  removeButton: {
    padding: 2,
  },
  dayChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  daySubLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  dayLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
});


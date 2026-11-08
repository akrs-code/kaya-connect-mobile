/**
 * @file button.tsx
 * @description Standardized button component with primary, secondary, outline, and ghost variants,
 * loading state spinner, and icon slots.
 */

import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  useColorScheme,
  ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { Icon } from './icon';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: string;
  rightIcon?: string;
  style?: ViewStyle | ViewStyle[];
}

export function Button({
  title,
  variant = 'primary',
  size = 'lg',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceSecondary;
    switch (variant) {
      case 'primary':
        return colors.primaryContainer;
      case 'secondary':
        return colors.surfaceSecondary;
      case 'outline':
      case 'ghost':
        return 'transparent';
      case 'danger':
        return colors.error;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.outline;
    switch (variant) {
      case 'primary':
      case 'danger':
        return colors.onPrimary;
      case 'secondary':
        return colors.onSurface;
      case 'outline':
        return colors.onSurface;
      case 'ghost':
        return colors.primary;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') {
      return colors.border;
    }
    return 'transparent';
  };

  const textColor = getTextColor();

  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.base,
        styles[size],
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1 : 0,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {leftIcon && <Icon name={leftIcon} size={18} color={textColor} style={styles.leftIcon} />}
          <Text style={[styles.text, styles[`${size}Text`], { color: textColor }]}>{title}</Text>
          {rightIcon && (
            <Icon name={rightIcon} size={18} color={textColor} style={styles.rightIcon} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
  },
  sm: {
    minHeight: 44,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
  },
  md: {
    minHeight: 44,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
  },
  lg: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smText: {
    fontSize: 13,
  },
  mdText: {
    fontSize: 14,
  },
  lgText: {
    fontSize: 15,
  },
  leftIcon: {
    marginRight: Spacing.xs + 2,
  },
  rightIcon: {
    marginLeft: Spacing.xs + 2,
  },
});

